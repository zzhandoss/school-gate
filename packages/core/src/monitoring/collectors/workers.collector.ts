import type { WorkerStatus } from "../entities/monitoring.types.js";
import type {
    MonitoringSnapshotCollector,
    MonitoringSnapshotCollectorInput,
    MonitoringSnapshotSlice
} from "../pipeline/snapshotPipeline.js";

function buildWorkerStatus(
    input: { now: Date; updatedAt: Date; ttlMs: number },
    resolver: MonitoringSnapshotCollectorInput["workerStatusResolver"]
): WorkerStatus {
    return resolver(input);
}

export const collectWorkersSnapshot: MonitoringSnapshotCollector = async (
    input: MonitoringSnapshotCollectorInput
): Promise<MonitoringSnapshotSlice> => {
    const workers = await input.monitoringRepo.listWorkerHeartbeats();
    const workersWithStatus = workers.map((worker) => {
        const status = buildWorkerStatus(
            { now: input.now, updatedAt: worker.updatedAt, ttlMs: input.workerTtlMs },
            input.workerStatusResolver
        );
        return {
            ...worker,
            status,
            ttlMs: input.workerTtlMs
        };
    });

    return { workers: workersWithStatus };
};
