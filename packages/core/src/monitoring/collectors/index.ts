import type { MonitoringSnapshotCollector } from "../pipeline/snapshotPipeline.js";
import { collectAccessEventsSnapshot } from "./accessEvents.collector.js";
import { collectOutboxSnapshot } from "./outbox.collector.js";
import { collectWorkersSnapshot } from "./workers.collector.js";
import { collectTopErrorsSnapshot } from "./topErrors.collector.js";
import { collectComponentsSnapshot } from "./components.collector.js";
import { collectDeviceServiceSnapshot } from "./deviceService.collector.js";

type SnapshotCollectorDefinition = {
    id: string;
    collector: MonitoringSnapshotCollector;
};

const snapshotCollectorRegistry: SnapshotCollectorDefinition[] = [
    { id: "accessEvents", collector: collectAccessEventsSnapshot },
    { id: "outbox", collector: collectOutboxSnapshot },
    { id: "workers", collector: collectWorkersSnapshot },
    { id: "topErrors", collector: collectTopErrorsSnapshot },
    { id: "components", collector: collectComponentsSnapshot },
    { id: "deviceService", collector: collectDeviceServiceSnapshot }
];

export const snapshotCollectors = snapshotCollectorRegistry.map((entry) => entry.collector);
