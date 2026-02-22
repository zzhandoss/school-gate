import type { DevicesRepo } from "../repos/devices.repo.js";

type Clock = { now(): Date };

export type SetDeviceEnabledInput = {
    id: string;
    enabled: boolean;
};

export type SetDeviceEnabledResult = {
    updated: boolean;
};

export function createSetDeviceEnabledUC(deps: { devicesRepo: DevicesRepo; clock: Clock }) {
    return function setDeviceEnabled(input: SetDeviceEnabledInput): SetDeviceEnabledResult {
        const updated = deps.devicesRepo.setEnabled({
            id: input.id,
            enabled: input.enabled,
            updatedAt: deps.clock.now(),
        });
        return { updated };
    };
}
