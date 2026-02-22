import { and, desc, gte, lt, lte } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { monitoringSnapshots } from "@school-gate/db/schema";
import type {
    MonitoringSnapshot,
    MonitoringSnapshotsRepo,
    MonitoringSnapshotRecord,
    DeviceServiceMonitoring,
} from "@school-gate/core";

function toDate(value: unknown): Date | null {
    if (value == null) return null;
    if (value instanceof Date) return value;
    if (typeof value === "number") {
        const ms = value < 1_000_000_000_000 ? value * 1000 : value;
        return new Date(ms);
    }
    if (typeof value === "string") {
        const asNumber = Number(value);
        if (Number.isFinite(asNumber)) {
            const ms = asNumber < 1_000_000_000_000 ? asNumber * 1000 : asNumber;
            return new Date(ms);
        }
        return new Date(value);
    }
    return new Date(String(value));
}

function parseSnapshot(raw: unknown): MonitoringSnapshot {
    const data = raw && typeof raw === "object" ? (raw as any) : {};
    const accessEvents = data.accessEvents ?? {};
    const outbox = data.outbox ?? {};
    const topErrors = data.topErrors ?? {};

    const workers = Array.isArray(data.workers) ? data.workers : [];
    const components = Array.isArray(data.components) ? data.components : [];
    const deviceService = data.deviceService ?? null;

    return {
        now: toDate(data.now) ?? new Date(0),
        accessEvents: {
            counts: accessEvents.counts ?? {},
            oldestUnprocessedOccurredAt: toDate(accessEvents.oldestUnprocessedOccurredAt),
        },
        outbox: {
            counts: outbox.counts ?? {},
            oldestNewCreatedAt: toDate(outbox.oldestNewCreatedAt),
        },
        workers: workers.map((worker: any) => ({
            workerId: String(worker.workerId),
            updatedAt: toDate(worker.updatedAt) ?? new Date(0),
            lastStartedAt: toDate(worker.lastStartedAt),
            lastSuccessAt: toDate(worker.lastSuccessAt),
            lastErrorAt: toDate(worker.lastErrorAt),
            lastError: worker.lastError ?? null,
            status: worker.status,
            ttlMs: worker.ttlMs,
            meta: worker.meta ?? null,
        })),
        topErrors: {
            accessEvents: Array.isArray(topErrors.accessEvents)
                ? topErrors.accessEvents.map((stat: any) => ({
                      error: String(stat.error),
                      count: Number(stat.count ?? 0),
                      lastAt: toDate(stat.lastAt),
                  }))
                : [],
            outbox: Array.isArray(topErrors.outbox)
                ? topErrors.outbox.map((stat: any) => ({
                      error: String(stat.error),
                      count: Number(stat.count ?? 0),
                      lastAt: toDate(stat.lastAt),
                  }))
                : [],
        },
        components: components.map((component: any) => ({
            componentId: String(component.componentId),
            status: component.status,
            checkedAt: toDate(component.checkedAt) ?? new Date(0),
            responseTimeMs: component.responseTimeMs ?? null,
            error: component.error ?? null,
        })),
        deviceService: deviceService
            ? ({
                  adapters: Array.isArray(deviceService.adapters)
                      ? deviceService.adapters.map((adapter: any) => ({
                            adapterId: String(adapter.adapterId),
                            vendorKey: String(adapter.vendorKey),
                            baseUrl: String(adapter.baseUrl),
                            mode: adapter.mode,
                            lastSeenAt: toDate(adapter.lastSeenAt) ?? new Date(0),
                            status: adapter.status,
                            ttlMs: adapter.ttlMs,
                        }))
                      : [],
                  devices: Array.isArray(deviceService.devices)
                      ? deviceService.devices.map((device: any) => ({
                            deviceId: String(device.deviceId),
                            name: device.name ?? null,
                            adapterKey: String(device.adapterKey),
                            lastEventAt: toDate(device.lastEventAt),
                            status: device.status,
                            ttlMs: device.ttlMs,
                        }))
                      : [],
                  outbox: {
                      counts: (deviceService.outbox?.counts ?? {}) as DeviceServiceMonitoring["outbox"]["counts"],
                      oldestNewCreatedAt: toDate(deviceService.outbox?.oldestNewCreatedAt),
                  },
              } satisfies DeviceServiceMonitoring)
            : null,
    };
}

function mapRow(row: any): MonitoringSnapshotRecord {
    const snapshot = parseSnapshot(JSON.parse(row.snapshotJson));
    return {
        id: row.id,
        createdAt: toDate(row.createdAt) ?? new Date(0),
        snapshot,
    };
}

export function createMonitoringSnapshotsRepo(db: Db): MonitoringSnapshotsRepo {
    return {
        insert(input) {
            db.insert(monitoringSnapshots)
                .values({
                    id: input.id,
                    createdAt: input.createdAt,
                    snapshotJson: JSON.stringify(input.snapshot),
                    outboxNewCount: input.outboxNewCount,
                    outboxOldestNewAt: input.outboxOldestNewAt,
                    accessOldestUnprocessedAt: input.accessOldestUnprocessedAt,
                })
                .run();
        },

        list(input) {
            const conditions = [];
            if (input.from) conditions.push(gte(monitoringSnapshots.createdAt, input.from));
            if (input.to) conditions.push(lte(monitoringSnapshots.createdAt, input.to));

            const query = conditions.length
                ? db
                      .select()
                      .from(monitoringSnapshots)
                      .where(and(...conditions))
                : db.select().from(monitoringSnapshots);

            const rows = query
                .orderBy(desc(monitoringSnapshots.createdAt))
                .limit(input.limit)
                .all();

            console.log(rows, "ROWS");

            return rows.map(mapRow);
        },

        deleteOlderThan(input) {
            return db
                .delete(monitoringSnapshots)
                .where(lt(monitoringSnapshots.createdAt, input.before))
                .run().changes;
        },

        getLatest() {
            const row = db
                .select()
                .from(monitoringSnapshots)
                .orderBy(desc(monitoringSnapshots.createdAt))
                .limit(1)
                .get();
            return row ? mapRow(row) : null;
        },
        withTx(tx) {
            return createMonitoringSnapshotsRepo(tx as Db);
        },

    };
}

