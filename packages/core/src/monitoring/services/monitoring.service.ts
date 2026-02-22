import type { WorkerStatus } from "../entities/monitoring.types.js";
import type { MonitoringService, MonitoringServiceDeps } from "./monitoring.types.js";
import { snapshotCollectors } from "../collectors/index.js";
import { collectSnapshot } from "../pipeline/snapshotPipeline.js";

function defaultWorkerStatusResolver(input: { now: Date; updatedAt: Date; ttlMs: number }): WorkerStatus {
    const ageMs = input.now.getTime() - input.updatedAt.getTime();
    return ageMs <= input.ttlMs ? "ok" : "stale";
}

export function createMonitoringService(deps: MonitoringServiceDeps): MonitoringService {
    const workerStatusResolver = deps.workerStatusResolver ?? defaultWorkerStatusResolver;
    return {
        withTx(tx: unknown) {
            return createMonitoringService({
                ...deps,
                monitoringRepo: deps.monitoringRepo.withTx(tx),
            });
        },



        getSnapshot() {
            const now = deps.clock.now();
            return collectSnapshot({
                now,
                monitoringRepo: deps.monitoringRepo,
                componentsProvider: deps.componentsProvider,
                workerTtlMs: deps.workerTtlMs,
                workerStatusResolver,
                collectors: snapshotCollectors,
            });
        },
    };
}


