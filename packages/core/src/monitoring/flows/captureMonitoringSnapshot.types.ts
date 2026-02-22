import type { MonitoringSnapshotsService } from "../services/monitoringSnapshots.types.js";
import type { MonitoringService } from "../services/monitoring.types.js";
import type { IdGenerator } from "../../utils/index.js";

export type CaptureMonitoringSnapshotFlowDeps = {
    snapshotsService: MonitoringSnapshotsService;
    monitoringService: MonitoringService;
    idGen: IdGenerator;
};

export type CaptureMonitoringSnapshotInput = {
    now?: Date | undefined;
};
