import type {
    MonitoringSnapshotInsert,
    MonitoringSnapshotRecord
} from "../../monitoring/index.js";
import type { MonitoringService, MonitoringSnapshotsService } from "../../monitoring/index.js";
import type { IdGenerator } from "../../utils/index.js";

export function createCaptureMonitoringSnapshotUC(deps: {
    snapshotService: MonitoringSnapshotsService;
    monitoringService: MonitoringService;
    idGen: IdGenerator;
}) {
    return async function captureMonitoringSnapshot(): Promise<MonitoringSnapshotRecord> {
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

        deps.snapshotService.insert(insert);

        return record;
    };
}
