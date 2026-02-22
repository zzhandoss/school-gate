import type { DevicesRepo } from "../repos/devices.repo.js";

export type DeleteDeviceResult = {
    deleted: boolean;
};

export function createDeleteDeviceUC(deps: { devicesRepo: DevicesRepo }) {
    return function deleteDevice(id: string): DeleteDeviceResult {
        const deleted = deps.devicesRepo.delete(id);
        return { deleted };
    };
}
