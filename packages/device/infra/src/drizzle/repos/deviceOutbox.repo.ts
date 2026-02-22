import { and, asc, eq, inArray, isNull, lt, min, or, sql } from "drizzle-orm";
import { deviceOutboxEvents } from "@school-gate/device/device-db/schema/deviceOutbox";
import type { DeviceDb } from "@school-gate/device/device-db/drizzle";
import type {
    DeviceOutboxRepo,
    DeviceOutboxRecord,
    DeviceOutboxStatus,
    DeviceOutboxStatusCounts,
} from "@school-gate/device/core/repos/deviceOutbox.repo";

const deviceOutboxStatuses: DeviceOutboxStatus[] = ["new", "processing", "processed", "error"];

function emptyDeviceOutboxCounts(): DeviceOutboxStatusCounts {
    return deviceOutboxStatuses.reduce(
        (acc, status) => {
            acc[status] = 0;
            return acc;
        },
        {} as DeviceOutboxStatusCounts
    );
}

export function createDeviceOutboxRepo(db: DeviceDb): DeviceOutboxRepo {
    const enqueue: DeviceOutboxRepo["enqueue"] = (input) => {
            db.insert(deviceOutboxEvents).values({
                id: input.id,
                type: input.event.type,
                payloadJson: JSON.stringify(input.event.payload),
                status: "new",
                attempts: 0,
            }).run();
    };

    const claimBatch: DeviceOutboxRepo["claimBatch"] = (input) => {
            const reclaimBefore = new Date(input.now.getTime() - input.leaseMs);
            const eligible = or(
                eq(deviceOutboxEvents.status, "new"),
                and(
                    eq(deviceOutboxEvents.status, "processing"),
                    or(isNull(deviceOutboxEvents.processingAt), lt(deviceOutboxEvents.processingAt, reclaimBefore))
                )
            );

            const rows = db
                .select({
                    id: deviceOutboxEvents.id,
                    type: deviceOutboxEvents.type,
                    payloadJson: deviceOutboxEvents.payloadJson,
                    attempts: deviceOutboxEvents.attempts,
                })
                .from(deviceOutboxEvents)
                .where(eligible)
                .orderBy(asc(deviceOutboxEvents.createdAt))
                .limit(input.limit)
                .all();

            if (rows.length === 0) return [];

            const ids = rows.map((r) => r.id);
            db
                .update(deviceOutboxEvents)
                .set({
                    status: "processing",
                    attempts: sql`${deviceOutboxEvents.attempts} + 1`,
                    processingAt: input.now,
                    processingBy: input.processingBy,
                })
                .where(and(inArray(deviceOutboxEvents.id, ids), eligible))
                .run();

            return rows as DeviceOutboxRecord[];
    };

    const markProcessed: DeviceOutboxRepo["markProcessed"] = (input) => {
            db
                .update(deviceOutboxEvents)
                .set({
                    status: "processed",
                    processedAt: input.processedAt,
                    lastError: null,
                })
                .where(eq(deviceOutboxEvents.id, input.id))
                .run();
    };

    const markFailed: DeviceOutboxRepo["markFailed"] = (input) => {
            db
                .update(deviceOutboxEvents)
                .set({
                    status: sql`CASE WHEN ${deviceOutboxEvents.attempts} >= ${input.maxAttempts} THEN 'error' ELSE 'new' END`,
                    lastError: input.error,
                    processingAt: null,
                    processingBy: null,
                })
                .where(eq(deviceOutboxEvents.id, input.id))
                .run();
    };

    const getStatusCounts: DeviceOutboxRepo["getStatusCounts"] = () => {
        const rows = db
            .select({
                status: deviceOutboxEvents.status,
                count: sql<number>`count(*)`,
            })
            .from(deviceOutboxEvents)
            .groupBy(deviceOutboxEvents.status)
            .all();

        const counts = emptyDeviceOutboxCounts();
        for (const row of rows) {
            const status = row.status as DeviceOutboxStatus;
            counts[status] = Number(row.count);
        }
        return counts;
    };

    const getOldestCreatedAt: DeviceOutboxRepo["getOldestCreatedAt"] = (statuses) => {
        if (statuses.length === 0) return null;
        const rows = db
            .select({ value: min(deviceOutboxEvents.createdAt) })
            .from(deviceOutboxEvents)
            .where(inArray(deviceOutboxEvents.status, statuses))
            .orderBy(asc(deviceOutboxEvents.createdAt))
            .limit(1)
            .all();

        const value = rows[0]?.value;
        return value ? new Date(value) : null;
    };

    return {
        enqueue,
        claimBatch,
        markProcessed,
        markFailed,
        getStatusCounts,
        getOldestCreatedAt,
    };
}
