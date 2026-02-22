import type { DeviceDirection, DevicesRepo } from "../repos/devices.repo.js";

type Clock = { now(): Date };

export type UpsertDeviceInput = {
    id: string;
    name: string;
    direction: DeviceDirection;
    adapterKey: string;
    settingsJson?: string | null;
    enabled?: boolean;
};

export function createUpsertDeviceUC(deps: { devicesRepo: DevicesRepo; clock: Clock }) {
    return function upsertDevice(input: UpsertDeviceInput): void {
        const now = deps.clock.now();
        deps.devicesRepo.upsert({
            id: input.id,
            name: input.name,
            direction: input.direction,
            adapterKey: input.adapterKey,
            settingsJson: input.settingsJson ?? null,
            enabled: input.enabled ?? true,
            createdAt: now,
            updatedAt: now
        });
    };
}
