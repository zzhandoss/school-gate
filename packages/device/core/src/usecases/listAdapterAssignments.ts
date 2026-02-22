import type { DeviceCursorsRepo } from "../repos/deviceCursors.repo.js";
import type { DevicesRepo, DeviceDirection } from "../repos/devices.repo.js";

export type AdapterAssignment = {
    deviceId: string;
    direction: DeviceDirection;
    settingsJson: string | null;
    lastAckedEventId: string | null;
};

export type ListAdapterAssignmentsResult = {
    devices: AdapterAssignment[];
};

export function createListAdapterAssignmentsUC(deps: {
    devicesRepo: DevicesRepo;
    deviceCursorsRepo: DeviceCursorsRepo;
}) {
    return function listAdapterAssignments(adapterKey: string): ListAdapterAssignmentsResult {
        const devices = deps.devicesRepo
            .listByAdapterKey(adapterKey)
            .filter((device) => device.enabled);

        return {
            devices: devices.map((device) => {
                const cursor = deps.deviceCursorsRepo.getByDeviceId(device.id);
                return {
                    deviceId: device.id,
                    direction: device.direction,
                    settingsJson: device.settingsJson,
                    lastAckedEventId: cursor?.lastAckedEventId ?? null
                };
            })
        };
    };
}
