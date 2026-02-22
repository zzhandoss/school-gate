import type {
    MonitoringSnapshotInsert,
    MonitoringSnapshotRecord,
} from "../entities/monitoring.types.js";

export type MonitoringSnapshotsRepo = {
    insert(input: MonitoringSnapshotInsert): void;
    list(input: { from?: Date | undefined; to?: Date | undefined; limit: number }): MonitoringSnapshotRecord[];
    deleteOlderThan(input: { before: Date }): number;
    getLatest(): MonitoringSnapshotRecord | null;
    withTx(tx: unknown): MonitoringSnapshotsRepo;
};

