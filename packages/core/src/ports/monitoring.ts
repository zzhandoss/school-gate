import type { ComponentHealth, DeviceServiceMonitoring } from "../monitoring/index.js";

export type MonitoringComponentsProvider = {
    listComponents(): Promise<ComponentHealth[]>;
    getDeviceServiceMonitoring(): Promise<DeviceServiceMonitoring | null>;
};
