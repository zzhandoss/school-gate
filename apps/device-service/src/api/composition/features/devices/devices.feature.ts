import {
    getDeviceServiceDeviceResultSchema,
    listDeviceServiceDevicesResultSchema,
    type UpsertDeviceServiceDeviceDto,
    type UpdateDeviceServiceDeviceDto,
    type DeviceServiceDeviceDto,
    type GetDeviceServiceDeviceResultDto,
    type ListDeviceServiceDevicesResultDto
} from "@school-gate/contracts";
import type { Device } from "@school-gate/device/core/repos/devices.repo";
import { notFoundError } from "../../../delivery/http/errors/httpError.js";

export type DevicesModule = {
    list: () => Promise<ListDeviceServiceDevicesResultDto>;
    get: (id: string) => Promise<GetDeviceServiceDeviceResultDto>;
    upsert: (input: UpsertDeviceServiceDeviceDto) => Promise<{ ok: true }>;
    update: (id: string, input: UpdateDeviceServiceDeviceDto) => Promise<{ ok: true }>;
    setEnabled: (input: { deviceId: string; enabled: boolean }) => Promise<{ ok: true }>;
    delete: (id: string) => Promise<{ ok: true }>;
};

type CreateDevicesModuleInput = {
    list: () => Promise<{ devices: Device[] }> | { devices: Device[] };
    get: (id: string) => Promise<Device | null> | Device | null;
    upsert: (input: UpsertDeviceServiceDeviceDto) => Promise<void> | void;
    update: (id: string, input: UpdateDeviceServiceDeviceDto) => Promise<boolean> | boolean;
    setEnabled: (input: { deviceId: string; enabled: boolean }) => Promise<boolean> | boolean;
    delete: (id: string) => Promise<boolean> | boolean;
};

function toDto(device: Device): DeviceServiceDeviceDto {
    return {
        deviceId: device.id,
        name: device.name ?? device.id,
        direction: device.direction,
        adapterKey: device.adapterKey,
        enabled: device.enabled,
        settingsJson: device.settingsJson,
        createdAt: device.createdAt.toISOString(),
        updatedAt: device.updatedAt.toISOString()
    };
}

export function createDevicesModule(input: CreateDevicesModuleInput): DevicesModule {
    return {
        list: async () => {
            const result = await input.list();
            return listDeviceServiceDevicesResultSchema.parse({
                devices: result.devices.map(toDto)
            });
        },
        get: async (id) => {
            const device = await input.get(id);
            if (!device) {
                throw notFoundError("device_not_found", "Device was not found");
            }
            return getDeviceServiceDeviceResultSchema.parse({ device: toDto(device) });
        },
        upsert: async (payload) => {
            await input.upsert(payload);
            return { ok: true as const };
        },
        update: async (id, payload) => {
            const updated = await input.update(id, payload);
            if (!updated) {
                throw notFoundError("device_not_found", "Device was not found");
            }
            return { ok: true as const };
        },
        setEnabled: async (payload) => {
            const updated = await input.setEnabled(payload);
            if (!updated) {
                throw notFoundError("device_not_found", "Device was not found");
            }
            return { ok: true as const };
        },
        delete: async (id) => {
            const deleted = await input.delete(id);
            if (!deleted) {
                throw notFoundError("device_not_found", "Device was not found");
            }
            return { ok: true as const };
        }
    };
}
