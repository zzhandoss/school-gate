import { createInternalMonitoringRoutes as createMonitoringRoutes } from "../delivery/http/routes/internalMonitoring.route.js";

export type DeviceServiceMonitoringDto = {
    adapters: {
        adapterId: string;
        vendorKey: string;
        instanceKey: string;
        instanceName: string;
        baseUrl: string;
        mode: "active" | "draining";
        lastSeenAt: string;
        status: "ok" | "stale";
        ttlMs: number;
    }[];
    devices: {
        deviceId: string;
        name: string | null;
        adapterKey: string;
        lastEventAt: string | null;
        status: "ok" | "stale";
        ttlMs: number;
    }[];
    outbox: {
        counts: Record<string, number>;
        oldestNewCreatedAt: string | null;
    };
};

export type DeviceServiceMonitoringHandlers = {
    getSnapshot(): DeviceServiceMonitoringDto;
};

export function createInternalMonitoringRoutes(input: {
    token: string;
    handlers: DeviceServiceMonitoringHandlers;
}) {
    return createMonitoringRoutes({
        token: input.token,
        module: {
            getSnapshot: () => input.handlers.getSnapshot()
        }
    });
}
