import { createMonitoringService } from "../monitoring/services/monitoring.service.js";
import type { MonitoringRepo } from "../monitoring/repos/monitoring.repo.js";
import type { MonitoringComponentsProvider } from "../ports/monitoring.js";
import type { Clock } from "../utils/common.types.js";

type LegacyDeps = {
    monitoringRepo: MonitoringRepo;
    componentsProvider: MonitoringComponentsProvider;
    clock: Clock;
    workerTtlMs: number;
};

export function createGetMonitoringSnapshotUC(deps: LegacyDeps) {
    const service = createMonitoringService({
        monitoringRepo: deps.monitoringRepo,
        componentsProvider: deps.componentsProvider,
        clock: deps.clock,
        workerTtlMs: deps.workerTtlMs
    });
    return () => service.getSnapshot();
}
