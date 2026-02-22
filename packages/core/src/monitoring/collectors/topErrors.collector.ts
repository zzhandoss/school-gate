import type {
    MonitoringSnapshotCollector,
    MonitoringSnapshotCollectorInput,
    MonitoringSnapshotSlice,
} from "../pipeline/snapshotPipeline.js";

const TOP_ERRORS_LIMIT = 10;

export const collectTopErrorsSnapshot: MonitoringSnapshotCollector = async (
    input: MonitoringSnapshotCollectorInput
): Promise<MonitoringSnapshotSlice> => {
    const [accessEvents, outbox] = await Promise.all([
        input.monitoringRepo.getTopAccessEventErrors(TOP_ERRORS_LIMIT),
        input.monitoringRepo.getTopOutboxErrors(TOP_ERRORS_LIMIT),
    ]);

    return { topErrors: { accessEvents, outbox } };
};
