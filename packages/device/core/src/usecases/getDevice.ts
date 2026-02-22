import type { Device, DevicesRepo } from "../repos/devices.repo.js";

export function createGetDeviceUC(deps: { devicesRepo: DevicesRepo }) {
    return function getDevice(id: string): Device | null {
        return deps.devicesRepo.getById(id);
    };
}
