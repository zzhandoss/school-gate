import type { AccessEventStatus } from "../../events/index.js";
import type {
    MonitoringSnapshotCollector,
    MonitoringSnapshotCollectorInput,
    MonitoringSnapshotSlice
} from "../pipeline/snapshotPipeline.js";

const UNPROCESSED_ACCESS_STATUSES: AccessEventStatus[] = [
    "NEW",
    "PROCESSING",
    "FAILED_RETRY",
    "UNMATCHED",
    "ERROR"
];

export const collectAccessEventsSnapshot: MonitoringSnapshotCollector = async (
    input: MonitoringSnapshotCollectorInput
): Promise<MonitoringSnapshotSlice> => {
    const [counts, oldestUnprocessedOccurredAt] = await Promise.all([
        input.monitoringRepo.getAccessEventsStatusCounts(),
        input.monitoringRepo.getOldestAccessEventsOccurredAt(UNPROCESSED_ACCESS_STATUSES)
    ]);

    return {
        accessEvents: {
            counts,
            oldestUnprocessedOccurredAt
        }
    };
};
