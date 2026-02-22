import type { Device, DevicesRepo } from "../repos/devices.repo.js";

export type ListDevicesResult = {
    devices: Device[];
};

export function createListDevicesUC(deps: { devicesRepo: DevicesRepo }) {
    return function listDevices(): ListDevicesResult {
        const devices = deps.devicesRepo.list();
        return { devices };
    };
}
