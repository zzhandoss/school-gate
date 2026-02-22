import {
    listDeviceServiceAdaptersResultSchema,
    type ListDeviceServiceAdaptersResultDto,
    type DeviceServiceAdapterDto,
} from "@school-gate/contracts";
import type { AdapterRegistry } from "../../../adapterRegistry.js";

export type AdaptersAdminModule = {
    list: () => ListDeviceServiceAdaptersResultDto | Promise<ListDeviceServiceAdaptersResultDto>;
};

function toDto(adapter: ReturnType<AdapterRegistry["list"]>[number]): DeviceServiceAdapterDto {
    return {
        adapterId: adapter.adapterId,
        vendorKey: adapter.vendorKey,
        instanceKey: adapter.instanceKey,
        instanceName: adapter.instanceName,
        baseUrl: adapter.baseUrl,
        retentionMs: adapter.retentionMs,
        capabilities: adapter.capabilities,
        deviceSettingsSchema: adapter.deviceSettingsSchema ?? null,
        version: adapter.version,
        mode: adapter.mode,
        registeredAt: adapter.registeredAt.toISOString(),
        lastSeenAt: adapter.lastSeenAt.toISOString(),
    };
}

export function createAdaptersAdminModule(input: { registry: AdapterRegistry }): AdaptersAdminModule {
    return {
        list: () => {
            return listDeviceServiceAdaptersResultSchema.parse({
                adapters: input.registry.list().map(toDto),
            });
        },
    };
}
