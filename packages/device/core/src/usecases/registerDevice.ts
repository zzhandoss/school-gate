import type { DevicesRepo, DeviceDirection } from "../repos/devices.repo.js";

type Clock = { now(): Date };

export type RegisterDeviceInput = {
    id: string;
    name: string | null;
    direction: DeviceDirection;
    adapterKey: string;
    settingsJson?: string | null;
    enabled?: boolean;
};

export type RegisterDeviceResult = {
    id: string;
};

export function createRegisterDeviceUC(deps: { devicesRepo: DevicesRepo; clock: Clock }) {
    return function registerDevice(input: RegisterDeviceInput): RegisterDeviceResult {
        const now = deps.clock.now();
        deps.devicesRepo.upsert({
            id: input.id,
            name: input.name ?? null,
            direction: input.direction,
            adapterKey: input.adapterKey,
            settingsJson: input.settingsJson ?? null,
            enabled: input.enabled ?? true,
            createdAt: now,
            updatedAt: now,
        });

        return { id: input.id };
    };
}
