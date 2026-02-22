import type {
    MonitoringSnapshotCollector,
    MonitoringSnapshotCollectorInput,
    MonitoringSnapshotSlice,
} from "../pipeline/snapshotPipeline.js";

export const collectDeviceServiceSnapshot: MonitoringSnapshotCollector = async (
    input: MonitoringSnapshotCollectorInput
): Promise<MonitoringSnapshotSlice> => {
    const deviceService = await input.componentsProvider.getDeviceServiceMonitoring();
    return { deviceService };
};
