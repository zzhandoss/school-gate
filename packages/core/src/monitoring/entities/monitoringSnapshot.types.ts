import type { AccessEventsStatusCounts, OutboxStatusCounts } from "./monitoringStatus.types.js";
import type { ErrorStat } from "./monitoringErrors.types.js";
import type { WorkerMonitoring } from "./monitoringWorkers.types.js";
import type { ComponentHealth } from "./monitoringComponents.types.js";
import type { DeviceServiceMonitoring } from "./monitoringDeviceService.types.js";

export type MonitoringSnapshot = {
    now: Date;
    accessEvents: {
        counts: AccessEventsStatusCounts;
        oldestUnprocessedOccurredAt: Date | null;
    };
    outbox: {
        counts: OutboxStatusCounts;
        oldestNewCreatedAt: Date | null;
    };
    workers: WorkerMonitoring[];
    topErrors: {
        accessEvents: ErrorStat[];
        outbox: ErrorStat[];
    };
    components: ComponentHealth[];
    deviceService: DeviceServiceMonitoring | null;
};

export type MonitoringSnapshotRecord = {
    id: string;
    createdAt: Date;
    snapshot: MonitoringSnapshot;
};

export type MonitoringSnapshotInsert = {
    id: string;
    createdAt: Date;
    snapshot: MonitoringSnapshot;
    outboxNewCount: number;
    outboxOldestNewAt: Date | null;
    accessOldestUnprocessedAt: Date | null;
};
