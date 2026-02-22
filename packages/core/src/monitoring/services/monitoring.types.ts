import type { MonitoringComponentsProvider } from "../../ports/index.js";
import type { MonitoringRepo } from "../repos/monitoring.repo.js";
import type { Clock } from "../../utils/index.js";
import type { MonitoringSnapshot, WorkerStatus } from "../entities/monitoring.types.js";

export type MonitoringClock = Clock;

export type MonitoringService = {
    getSnapshot(): Promise<MonitoringSnapshot>;
    withTx(tx: unknown): MonitoringService;
};

export type MonitoringServiceDeps = {
    monitoringRepo: MonitoringRepo;
    componentsProvider: MonitoringComponentsProvider;
    clock: MonitoringClock;
    workerTtlMs: number;
    workerStatusResolver?: WorkerStatusResolver;
};

export type WorkerStatusResolver = (input: { now: Date; updatedAt: Date; ttlMs: number }) => WorkerStatus;

