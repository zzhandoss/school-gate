import type { MonitoringComponentsProvider } from "../../ports/index.js";
import type { MonitoringSnapshot } from "../entities/monitoring.types.js";
import type { MonitoringRepo } from "../repos/monitoring.repo.js";
import type { WorkerStatusResolver } from "../services/monitoring.types.js";

export type MonitoringSnapshotSlice =
    | Pick<MonitoringSnapshot, "accessEvents">
    | Pick<MonitoringSnapshot, "outbox">
    | Pick<MonitoringSnapshot, "workers">
    | Pick<MonitoringSnapshot, "topErrors">
    | Pick<MonitoringSnapshot, "components">
    | Pick<MonitoringSnapshot, "deviceService">;

export type MonitoringSnapshotCollectorInput = {
    now: Date;
    monitoringRepo: MonitoringRepo;
    componentsProvider: MonitoringComponentsProvider;
    workerTtlMs: number;
    workerStatusResolver: WorkerStatusResolver;
};

export type MonitoringSnapshotCollector = (
    input: MonitoringSnapshotCollectorInput
) => Promise<MonitoringSnapshotSlice>;

function assertSnapshotComplete(
    snapshot: Partial<Omit<MonitoringSnapshot, "now">>
): asserts snapshot is Omit<MonitoringSnapshot, "now"> {
    const missing: string[] = [];
    if (snapshot.accessEvents === undefined) {
        missing.push("accessEvents");
    }
    if (snapshot.outbox === undefined) {
        missing.push("outbox");
    }
    if (snapshot.workers === undefined) {
        missing.push("workers");
    }
    if (snapshot.topErrors === undefined) {
        missing.push("topErrors");
    }
    if (snapshot.components === undefined) {
        missing.push("components");
    }
    if (snapshot.deviceService === undefined) {
        missing.push("deviceService");
    }
    if (missing.length > 0) {
        throw new Error(`Monitoring snapshot collectors missing: ${missing.join(", ")}`);
    }
}

export async function collectSnapshot(input: {
    now: Date;
    monitoringRepo: MonitoringRepo;
    componentsProvider: MonitoringComponentsProvider;
    workerTtlMs: number;
    workerStatusResolver: WorkerStatusResolver;
    collectors: MonitoringSnapshotCollector[];
}): Promise<MonitoringSnapshot> {
    const collectorInput: MonitoringSnapshotCollectorInput = {
        now: input.now,
        monitoringRepo: input.monitoringRepo,
        componentsProvider: input.componentsProvider,
        workerTtlMs: input.workerTtlMs,
        workerStatusResolver: input.workerStatusResolver
    };

    const slices = await Promise.all(
        input.collectors.map((collector) => collector(collectorInput))
    );
    const partial = Object.assign({}, ...slices) as Partial<Omit<MonitoringSnapshot, "now">>;
    assertSnapshotComplete(partial);

    return { now: input.now, ...partial };
}
