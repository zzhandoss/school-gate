import {
    listDeviceServiceAdaptersResultSchema,
    type DeviceServiceAdapterDto,
    type ListDeviceServiceAdaptersResultDto,
} from "@school-gate/contracts";
import type { AdapterSession } from "../adapterRegistry.js";
import type { AdminAuth } from "../adminAuth.js";
import { createAdaptersRoutes } from "../delivery/http/routes/adapters.route.js";

export type DeviceServiceAdaptersHandlers = {
    list: () => Promise<AdapterSession[]> | AdapterSession[];
};

function toDto(adapter: AdapterSession): DeviceServiceAdapterDto {
    return {
        adapterId: adapter.adapterId,
        vendorKey: adapter.vendorKey,
        instanceKey: adapter.instanceKey,
        instanceName: adapter.instanceName,
        baseUrl: adapter.baseUrl,
        retentionMs: adapter.retentionMs,
        capabilities: adapter.capabilities,
        version: adapter.version,
        mode: adapter.mode,
        registeredAt: adapter.registeredAt.toISOString(),
        lastSeenAt: adapter.lastSeenAt.toISOString(),
    };
}

export function createDeviceServiceAdaptersRoutes(input: {
    handlers: DeviceServiceAdaptersHandlers;
    auth: AdminAuth;
}) {
    return createAdaptersRoutes({
        auth: input.auth,
        module: {
            list: () => {
                const adapters = input.handlers.list();
                if (adapters instanceof Promise) {
                    return adapters.then((items) => listDeviceServiceAdaptersResultSchema.parse({ adapters: items.map(toDto) }));
                }
                return listDeviceServiceAdaptersResultSchema.parse({ adapters: adapters.map(toDto) });
            },
        },
    });
}

export type { DeviceServiceAdapterDto, ListDeviceServiceAdaptersResultDto };
export { listDeviceServiceAdaptersResultSchema };
