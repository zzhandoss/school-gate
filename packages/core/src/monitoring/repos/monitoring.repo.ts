import type {
    AccessEventsStatusCounts,
    ErrorStat,
    OutboxStatus,
    OutboxStatusCounts
} from "../entities/monitoring.types.js";
import type { WorkerHeartbeat } from "../../ports/index.js";
import type { AccessEventStatus } from "../../events/index.js";

export type MonitoringRepo = {
    getAccessEventsStatusCounts(): Promise<AccessEventsStatusCounts>;
    getOldestAccessEventsOccurredAt(statuses: AccessEventStatus[]): Promise<Date | null>;
    getOutboxStatusCounts(): Promise<OutboxStatusCounts>;
    getOldestOutboxCreatedAt(statuses: OutboxStatus[]): Promise<Date | null>;
    listWorkerHeartbeats(): Promise<WorkerHeartbeat[]>;
    getTopAccessEventErrors(limit: number): Promise<ErrorStat[]>;
    getTopOutboxErrors(limit: number): Promise<ErrorStat[]>;
    withTx(tx: unknown): MonitoringRepo;
};

