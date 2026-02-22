import type {
    MonitoringSnapshotInsert,
    MonitoringSnapshotRecord
} from "../entities/monitoring.types.js";
import type {
    CaptureMonitoringSnapshotFlowDeps,
    CaptureMonitoringSnapshotInput
} from "./captureMonitoringSnapshot.types.js";

export function createCaptureMonitoringSnapshotFlow(deps: CaptureMonitoringSnapshotFlowDeps) {
    return async function captureMonitoringSnapshot(
        _input?: CaptureMonitoringSnapshotInput
    ): Promise<MonitoringSnapshotRecord> {
        const snapshot = await deps.monitoringService.getSnapshot();
        const record: MonitoringSnapshotRecord = {
            id: deps.idGen.nextId(),
            createdAt: snapshot.now,
            snapshot
        };

        const insert: MonitoringSnapshotInsert = {
            id: record.id,
            createdAt: record.createdAt,
            snapshot: record.snapshot,
            outboxNewCount: record.snapshot.outbox.counts.new,
            outboxOldestNewAt: record.snapshot.outbox.oldestNewCreatedAt,
            accessOldestUnprocessedAt: record.snapshot.accessEvents.oldestUnprocessedOccurredAt
        };

        deps.snapshotsService.insert(insert);

        return record;
    };
}
