import type {
    MonitoringSnapshotsService,
    MonitoringSnapshotsServiceDeps,
} from "./monitoringSnapshots.types.js";

export function createMonitoringSnapshotsService(
    deps: MonitoringSnapshotsServiceDeps
): MonitoringSnapshotsService {
    return {
        withTx(tx: unknown) {
            return createMonitoringSnapshotsService({
                ...deps,
                snapshotsRepo: deps.snapshotsRepo.withTx(tx),
            });
        },



        list(input) {
            return deps.snapshotsRepo.list(input);
        },
        deleteOlderThan(input) {
            return deps.snapshotsRepo.deleteOlderThan({ before: input.before });
        },
        insert(input) {
            deps.snapshotsRepo.insert(input);
        },
        getLatest() {
            return deps.snapshotsRepo.getLatest();
        }
    };
}


