import { createMonitoringSnapshotsService } from "../monitoring/services/monitoringSnapshots.service.js";
import type { MonitoringSnapshotsRepo } from "../monitoring/repos/monitoringSnapshots.repo.js";

type LegacyDeps = {
    snapshotsRepo: MonitoringSnapshotsRepo;
};

export function createListMonitoringSnapshotsUC(deps: LegacyDeps) {
    const service = createMonitoringSnapshotsService({ snapshotsRepo: deps.snapshotsRepo });
    return (input: { from?: Date; to?: Date; limit: number }) => service.list(input);
}
