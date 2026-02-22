import type { WorkerHeartbeat } from "../../ports/workerHeartbeats.js";
import type { WorkerStatus } from "./monitoringStatus.types.js";

export type WorkerMonitoring = WorkerHeartbeat & {
    status: WorkerStatus;
    ttlMs: number;
};
