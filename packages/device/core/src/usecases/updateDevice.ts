import type { DeviceDirection, DevicesRepo } from "../repos/devices.repo.js";

type Clock = { now(): Date };

export type UpdateDeviceInput = {
    id: string;
    name?: string | undefined;
    direction?: DeviceDirection | undefined;
    adapterKey?: string | undefined;
    settingsJson?: string | null | undefined;
    enabled?: boolean | undefined;
};

export type UpdateDeviceResult = {
    updated: boolean;
};

export function createUpdateDeviceUC(deps: { devicesRepo: DevicesRepo; clock: Clock }) {
    return function updateDevice(input: UpdateDeviceInput): UpdateDeviceResult {
        const existing = deps.devicesRepo.getById(input.id);
        if (!existing) return { updated: false };

        const now = deps.clock.now();
        deps.devicesRepo.upsert({
            id: existing.id,
            name: input.name ?? existing.name,
            direction: input.direction ?? existing.direction,
            adapterKey: input.adapterKey ?? existing.adapterKey,
            settingsJson: input.settingsJson === undefined ? existing.settingsJson : input.settingsJson,
            enabled: input.enabled ?? existing.enabled,
            createdAt: existing.createdAt,
            updatedAt: now,
        });

        return { updated: true };
    };
}
