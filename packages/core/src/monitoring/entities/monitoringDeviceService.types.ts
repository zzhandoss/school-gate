import type { AdapterStatus, DeviceStatus, OutboxStatusCounts } from "./monitoringStatus.types.js";

export type AdapterMonitoring = {
    adapterId: string;
    vendorKey: string;
    baseUrl: string;
    mode: "active" | "draining";
    lastSeenAt: Date;
    status: AdapterStatus;
    ttlMs: number;
};

export type DeviceMonitoring = {
    deviceId: string;
    name: string | null;
    adapterKey: string;
    lastEventAt: Date | null;
    status: DeviceStatus;
    ttlMs: number;
};

export type DeviceServiceMonitoring = {
    adapters: AdapterMonitoring[];
    devices: DeviceMonitoring[];
    outbox: {
        counts: OutboxStatusCounts;
        oldestNewCreatedAt: Date | null;
    };
};
