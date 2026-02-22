import { z } from "zod";

const nonNegativeInt = z.number().int().min(0);
const datetimeNullable = z.string().datetime().nullable();

export const accessEventsCountsSchema = z.object({
    NEW: nonNegativeInt,
    PROCESSING: nonNegativeInt,
    PROCESSED: nonNegativeInt,
    FAILED_RETRY: nonNegativeInt,
    UNMATCHED: nonNegativeInt,
    ERROR: nonNegativeInt,
});

export const outboxCountsSchema = z.object({
    new: nonNegativeInt,
    processing: nonNegativeInt,
    processed: nonNegativeInt,
    error: nonNegativeInt,
});

export const workerHeartbeatSchema = z.object({
    workerId: z.string().min(1),
    updatedAt: z.string().datetime(),
    lastStartedAt: datetimeNullable,
    lastSuccessAt: datetimeNullable,
    lastErrorAt: datetimeNullable,
    lastError: z.string().nullable(),
    status: z.enum(["ok", "stale"]),
    ttlMs: nonNegativeInt,
    meta: z.unknown().nullable(),
});

export const errorStatSchema = z.object({
    error: z.string().min(1),
    count: nonNegativeInt,
    lastAt: datetimeNullable,
});

export const topErrorsSchema = z.object({
    accessEvents: z.array(errorStatSchema),
    outbox: z.array(errorStatSchema),
});

export const componentHealthSchema = z.object({
    componentId: z.string().min(1),
    status: z.enum(["ok", "down"]),
    checkedAt: z.string().datetime(),
    responseTimeMs: nonNegativeInt.nullable(),
    error: z.string().nullable(),
});

export const adapterMonitoringSchema = z.object({
    adapterId: z.string().min(1),
    vendorKey: z.string().min(1),
    instanceKey: z.string().min(1),
    instanceName: z.string().min(1),
    baseUrl: z.string().min(1),
    mode: z.enum(["active", "draining"]),
    lastSeenAt: z.string().datetime(),
    status: z.enum(["ok", "stale"]),
    ttlMs: nonNegativeInt,
});

export const deviceMonitoringSchema = z.object({
    deviceId: z.string().min(1),
    name: z.string().nullable(),
    adapterKey: z.string().min(1),
    lastEventAt: datetimeNullable,
    status: z.enum(["ok", "stale"]),
    ttlMs: nonNegativeInt,
});

export const deviceServiceMonitoringSchema = z.object({
    adapters: z.array(adapterMonitoringSchema),
    devices: z.array(deviceMonitoringSchema),
    outbox: z.object({
        counts: outboxCountsSchema,
        oldestNewCreatedAt: datetimeNullable,
    }),
});

export const monitoringSnapshotSchema = z.object({
    now: z.string().datetime(),
    accessEvents: z.object({
        counts: accessEventsCountsSchema,
        oldestUnprocessedOccurredAt: datetimeNullable,
    }),
    outbox: z.object({
        counts: outboxCountsSchema,
        oldestNewCreatedAt: datetimeNullable,
    }),
    workers: z.array(workerHeartbeatSchema),
    topErrors: topErrorsSchema,
    components: z.array(componentHealthSchema),
    deviceService: deviceServiceMonitoringSchema.nullable(),
});

export const monitoringSnapshotRecordSchema = z.object({
    id: z.string().min(1),
    createdAt: z.string().datetime(),
    snapshot: monitoringSnapshotSchema,
});

export const listMonitoringSnapshotsQuerySchema = z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    limit: z.coerce.number().int().positive().max(500).default(120),
});

export const listMonitoringSnapshotsResultSchema = z.object({
    snapshots: z.array(monitoringSnapshotRecordSchema),
});

export type MonitoringSnapshotDto = z.infer<typeof monitoringSnapshotSchema>;
export type MonitoringSnapshotRecordDto = z.infer<typeof monitoringSnapshotRecordSchema>;
export type ListMonitoringSnapshotsQueryDto = z.infer<typeof listMonitoringSnapshotsQuerySchema>;
export type ListMonitoringSnapshotsResultDto = z.infer<typeof listMonitoringSnapshotsResultSchema>;
