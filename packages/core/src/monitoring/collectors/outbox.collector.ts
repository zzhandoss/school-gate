import type {
    MonitoringSnapshotCollector,
    MonitoringSnapshotCollectorInput,
    MonitoringSnapshotSlice,
} from "../pipeline/snapshotPipeline.js";

export const collectOutboxSnapshot: MonitoringSnapshotCollector = async (
    input: MonitoringSnapshotCollectorInput
): Promise<MonitoringSnapshotSlice> => {
    const [counts, oldestNewCreatedAt] = await Promise.all([
        input.monitoringRepo.getOutboxStatusCounts(),
        input.monitoringRepo.getOldestOutboxCreatedAt(["new"]),
    ]);

    return {
        outbox: {
            counts,
            oldestNewCreatedAt,
        },
    };
};
