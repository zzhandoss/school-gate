import {
    listDeviceServiceDevicesResultSchema,
    getDeviceServiceDeviceResultSchema,
    setDeviceServiceDeviceEnabledSchema,
    upsertDeviceServiceDeviceSchema,
    updateDeviceServiceDeviceSchema,
    type DeviceServiceDeviceDto,
    type GetDeviceServiceDeviceResultDto,
    type ListDeviceServiceDevicesResultDto,
    type SetDeviceServiceDeviceEnabledDto,
    type UpsertDeviceServiceDeviceDto,
    type UpdateDeviceServiceDeviceDto
} from "@school-gate/contracts";
import type { Device } from "@school-gate/device/core/repos/devices.repo";
import type { AdminAuth } from "../adminAuth.js";
import { createDevicesRoutes } from "../delivery/http/routes/devices.route.js";
import { createDevicesModule } from "../composition/features/devices/devices.feature.js";

export type DeviceServiceDevicesHandlers = {
    list: () => Promise<{ devices: Device[] }> | { devices: Device[] };
    get: (id: string) => Promise<Device | null> | Device | null;
    upsert: (input: UpsertDeviceServiceDeviceDto) => Promise<void> | void;
    update: (id: string, input: UpdateDeviceServiceDeviceDto) => Promise<boolean> | boolean;
    setEnabled: (input: { deviceId: string; enabled: boolean }) => Promise<boolean> | boolean;
    delete: (id: string) => Promise<boolean> | boolean;
};

export function createDeviceServiceDevicesRoutes(input: {
    handlers: DeviceServiceDevicesHandlers;
    auth: AdminAuth;
}) {
    return createDevicesRoutes({
        module: createDevicesModule(input.handlers),
        auth: input.auth
    });
}

export type {
    DeviceServiceDeviceDto,
    GetDeviceServiceDeviceResultDto,
    ListDeviceServiceDevicesResultDto,
    SetDeviceServiceDeviceEnabledDto,
    UpsertDeviceServiceDeviceDto,
    UpdateDeviceServiceDeviceDto
};
export {
    getDeviceServiceDeviceResultSchema,
    listDeviceServiceDevicesResultSchema,
    setDeviceServiceDeviceEnabledSchema,
    upsertDeviceServiceDeviceSchema,
    updateDeviceServiceDeviceSchema
};
