import {
    monitoringSnapshotRecordSchema,
    monitoringSnapshotSchema,
    type ListMonitoringSnapshotsResultDto,
    type MonitoringSnapshotDto,
    type MonitoringSnapshotRecordDto
} from "@school-gate/contracts";
import { createMonitoringService, createMonitoringSnapshotsService, type MonitoringSnapshot, type MonitoringSnapshotRecord } from "@school-gate/core";
import { createMonitoringRepo, createMonitoringSnapshotsRepo } from "@school-gate/infra";
import type { MonitoringModule } from "../../delivery/http/routes/monitoring.routes.js";
import type { ApiRuntime } from "../../runtime/createRuntime.js";

function toIso(value: Date | null): string | null {
    return value ? value.toISOString() : null;
}

function mapWorker(worker: MonitoringSnapshot["workers"][number]) {
    return {
        workerId: worker.workerId,
        updatedAt: worker.updatedAt.toISOString(),
        lastStartedAt: toIso(worker.lastStartedAt),
        lastSuccessAt: toIso(worker.lastSuccessAt),
        lastErrorAt: toIso(worker.lastErrorAt),
        lastError: worker.lastError,
        status: worker.status,
        ttlMs: worker.ttlMs,
        meta: worker.meta ?? null
    };
}

function mapErrorStat(stat: MonitoringSnapshot["topErrors"]["accessEvents"][number]) {
    return {
        error: stat.error,
        count: stat.count,
        lastAt: toIso(stat.lastAt)
    };
}

function mapComponent(component: MonitoringSnapshot["components"][number]) {
    return {
        componentId: component.componentId,
        status: component.status,
        checkedAt: component.checkedAt.toISOString(),
        responseTimeMs: component.responseTimeMs,
        error: component.error
    };
}

function mapAdapter(adapter: NonNullable<MonitoringSnapshot["deviceService"]>["adapters"][number]) {
    const adapterWithInstance = adapter as typeof adapter & {
        instanceKey?: string;
        instanceName?: string;
    };

    return {
        adapterId: adapter.adapterId,
        vendorKey: adapter.vendorKey,
        instanceKey: adapterWithInstance.instanceKey ?? adapter.adapterId,
        instanceName: adapterWithInstance.instanceName ?? adapter.adapterId,
        baseUrl: adapter.baseUrl,
        mode: adapter.mode,
        lastSeenAt: adapter.lastSeenAt.toISOString(),
        status: adapter.status,
        ttlMs: adapter.ttlMs
    };
}

function mapDevice(device: NonNullable<MonitoringSnapshot["deviceService"]>["devices"][number]) {
    return {
        deviceId: device.deviceId,
        name: device.name,
        adapterKey: device.adapterKey,
        lastEventAt: toIso(device.lastEventAt),
        status: device.status,
        ttlMs: device.ttlMs
    };
}

function mapDeviceService(snapshot: MonitoringSnapshot): MonitoringSnapshotDto["deviceService"] {
    if (!snapshot.deviceService) {
        return null;
    }

    return {
        adapters: snapshot.deviceService.adapters.map(mapAdapter),
        devices: snapshot.deviceService.devices.map(mapDevice),
        outbox: {
            counts: snapshot.deviceService.outbox.counts,
            oldestNewCreatedAt: toIso(snapshot.deviceService.outbox.oldestNewCreatedAt)
        }
    };
}

function mapSnapshot(snapshot: MonitoringSnapshot): MonitoringSnapshotDto {
    return monitoringSnapshotSchema.parse({
        now: snapshot.now.toISOString(),
        accessEvents: {
            counts: snapshot.accessEvents.counts,
            oldestUnprocessedOccurredAt: toIso(snapshot.accessEvents.oldestUnprocessedOccurredAt)
        },
        outbox: {
            counts: snapshot.outbox.counts,
            oldestNewCreatedAt: toIso(snapshot.outbox.oldestNewCreatedAt)
        },
        workers: snapshot.workers.map(mapWorker),
        topErrors: {
            accessEvents: snapshot.topErrors.accessEvents.map(mapErrorStat),
            outbox: snapshot.topErrors.outbox.map(mapErrorStat)
        },
        components: snapshot.components.map(mapComponent),
        deviceService: mapDeviceService(snapshot)
    });
}

function mapSnapshotRecord(record: MonitoringSnapshotRecord): MonitoringSnapshotRecordDto {
    return monitoringSnapshotRecordSchema.parse({
        id: record.id,
        createdAt: record.createdAt.toISOString(),
        snapshot: mapSnapshot(record.snapshot)
    });
}

export function createMonitoringFeature(runtime: ApiRuntime): MonitoringModule {
    const monitoringService = createMonitoringService({
        monitoringRepo: createMonitoringRepo(runtime.dbClient.db),
        componentsProvider: runtime.componentsProvider,
        clock: runtime.clock,
        workerTtlMs: runtime.monitoringCfg.workerTtlMs
    });
    const monitoringSnapshotsService = createMonitoringSnapshotsService({
        snapshotsRepo: createMonitoringSnapshotsRepo(runtime.dbClient.db)
    });

    return {
        getSnapshot: async () => mapSnapshot(await monitoringService.getSnapshot()),
        listSnapshots: async (input) => {
            const snapshots = await monitoringSnapshotsService.list({
                from: input.from ? new Date(input.from) : undefined,
                to: input.to ? new Date(input.to) : undefined,
                limit: input.limit
            });
            const data: ListMonitoringSnapshotsResultDto = {
                snapshots: snapshots.map(mapSnapshotRecord)
            };
            return data;
        }
    };
}
