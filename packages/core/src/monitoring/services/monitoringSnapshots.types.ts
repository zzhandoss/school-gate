import type {
    MonitoringSnapshotInsert,
    MonitoringSnapshotRecord,
} from "../entities/monitoring.types.js";
import type { MonitoringSnapshotsRepo } from "../repos/monitoringSnapshots.repo.js";

export type ListMonitoringSnapshotsInput = {
    from?: Date | undefined;
    to?: Date | undefined;
    limit: number;
};

export type CleanupMonitoringSnapshotsInput = {
    before: Date;
};

export type MonitoringSnapshotsService = {
    list(input: ListMonitoringSnapshotsInput): MonitoringSnapshotRecord[];
    deleteOlderThan(input: CleanupMonitoringSnapshotsInput): number;
    insert(input: MonitoringSnapshotInsert): void;
    getLatest(): MonitoringSnapshotRecord | null;
    withTx(tx: unknown): MonitoringSnapshotsService;
};

export type MonitoringSnapshotsServiceDeps = {
    snapshotsRepo: MonitoringSnapshotsRepo;
};

