import type { AdapterRegistry } from "../../../adapterRegistry.js";
import type { DeviceServiceMonitoringHandlers } from "../../../routes/internalMonitoring.routes.js";

export type MonitoringModule = {
    getSnapshot: DeviceServiceMonitoringHandlers["getSnapshot"];
};

function toIso(value: Date | null) {
    return value ? value.toISOString() : null;
}

export function createMonitoringModule(input: {
    registry: AdapterRegistry;
    getDeviceMonitoringSnapshot: () => {
        devices: {
            deviceId: string;
            name: string | null;
            adapterKey: string;
            lastEventAt: Date | null;
            status: "ok" | "stale";
            ttlMs: number;
        }[];
        outbox: {
            counts: Record<string, number>;
            oldestNewCreatedAt: Date | null;
        };
    };
    adapterTtlMs: number;
    now: () => Date;
}): MonitoringModule {
    return {
        getSnapshot: () => {
            const now = input.now();
            const adapters = input.registry.list().map((session) => {
                const ageMs = now.getTime() - session.lastSeenAt.getTime();
                return {
                    adapterId: session.adapterId,
                    vendorKey: session.vendorKey,
                    instanceKey: session.instanceKey,
                    instanceName: session.instanceName,
                    baseUrl: session.baseUrl,
                    mode: session.mode,
                    lastSeenAt: session.lastSeenAt.toISOString(),
                    status: ageMs <= input.adapterTtlMs ? ("ok" as const) : ("stale" as const),
                    ttlMs: input.adapterTtlMs,
                };
            });

            const snapshot = input.getDeviceMonitoringSnapshot();
            return {
                adapters,
                devices: snapshot.devices.map((device) => ({
                    deviceId: device.deviceId,
                    name: device.name,
                    adapterKey: device.adapterKey,
                    lastEventAt: toIso(device.lastEventAt),
                    status: device.status,
                    ttlMs: device.ttlMs,
                })),
                outbox: {
                    counts: snapshot.outbox.counts,
                    oldestNewCreatedAt: toIso(snapshot.outbox.oldestNewCreatedAt),
                },
            };
        },
    };
}
