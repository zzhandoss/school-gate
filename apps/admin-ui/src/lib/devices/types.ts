export type DeviceDirection = "IN" | "OUT";

export type DeviceItem = {
    deviceId: string
    name: string
    direction: DeviceDirection
    adapterKey: string
    enabled: boolean
    settingsJson: string | null
    createdAt: string
    updatedAt: string
};

export type DeviceUpsertInput = {
    deviceId: string
    name: string
    direction: DeviceDirection
    adapterKey: string
    enabled: boolean
    settingsJson?: string | null
};

export type DeviceUpdateInput = {
    name?: string
    direction?: DeviceDirection
    adapterKey?: string
    enabled?: boolean
    settingsJson?: string | null
};

export type DeviceAdapterCapabilities = Array<string>;

export type DeviceSettingsSchema = Record<string, unknown>;

export type DeviceAdapterItem = {
    adapterId: string
    vendorKey: string
    instanceKey: string
    instanceName: string
    baseUrl: string
    retentionMs: number
    capabilities: DeviceAdapterCapabilities
    deviceSettingsSchema?: DeviceSettingsSchema | null
    version?: string
    mode: "active" | "draining"
    registeredAt: string
    lastSeenAt: string
};

export type DeviceMonitoringAdapter = {
    adapterId: string
    vendorKey: string
    instanceKey: string
    instanceName: string
    baseUrl: string
    mode: "active" | "draining"
    lastSeenAt: string
    status: "ok" | "stale"
    ttlMs: number
};

export type DeviceMonitoringDevice = {
    deviceId: string
    name: string | null
    adapterKey: string
    lastEventAt: string | null
    status: "ok" | "stale"
    ttlMs: number
};

export type DeviceMonitoringSnapshot = {
    adapters: Array<DeviceMonitoringAdapter>
    devices: Array<DeviceMonitoringDevice>
    outbox: {
        counts: Record<string, number>
        oldestNewCreatedAt: string | null
    }
};
