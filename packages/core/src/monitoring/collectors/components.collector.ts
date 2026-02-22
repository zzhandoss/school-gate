import type {
    MonitoringSnapshotCollector,
    MonitoringSnapshotCollectorInput,
    MonitoringSnapshotSlice
} from "../pipeline/snapshotPipeline.js";

export const collectComponentsSnapshot: MonitoringSnapshotCollector = async (
    input: MonitoringSnapshotCollectorInput
): Promise<MonitoringSnapshotSlice> => {
    const components = await input.componentsProvider.listComponents();
    return { components };
};
