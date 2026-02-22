import type { DeviceEventsRepo } from "../repos/deviceEvents.repo.js";
import type { DeviceOutboxRepo, DeviceOutboxStatusCounts } from "../repos/deviceOutbox.repo.js";
import type { DevicesRepo } from "../repos/devices.repo.js";

export type DeviceMonitoringSnapshot = {
    devices: {
        deviceId: string;
        name: string | null;
        adapterKey: string;
        lastEventAt: Date | null;
        status: "ok" | "stale";
        ttlMs: number;
    }[];
    outbox: {
        counts: DeviceOutboxStatusCounts;
        oldestNewCreatedAt: Date | null;
    };
};

export function createGetDeviceMonitoringSnapshotUC(deps: {
    devicesRepo: DevicesRepo;
    deviceEventsRepo: DeviceEventsRepo;
    deviceOutboxRepo: DeviceOutboxRepo;
    clock: { now: () => Date };
    deviceTtlMs: number;
}) {
    return function getDeviceMonitoringSnapshot(): DeviceMonitoringSnapshot {
        const now = deps.clock.now();
        const devices = deps.devicesRepo.list();
        const lastSeen = deps.deviceEventsRepo.listLastSeenByDeviceIds(devices.map((d) => d.id));
        const lastSeenMap = new Map(lastSeen.map((row) => [row.deviceId, row.lastEventAt]));

        return {
            devices: devices.map((device) => {
                const lastEventAt = lastSeenMap.get(device.id) ?? null;
                const ageMs = lastEventAt ? now.getTime() - lastEventAt.getTime() : Number.POSITIVE_INFINITY;
                const status = ageMs <= deps.deviceTtlMs ? "ok" : "stale";
                return {
                    deviceId: device.id,
                    name: device.name,
                    adapterKey: device.adapterKey,
                    lastEventAt,
                    status,
                    ttlMs: deps.deviceTtlMs
                };
            }),
            outbox: {
                counts: deps.deviceOutboxRepo.getStatusCounts(),
                oldestNewCreatedAt: deps.deviceOutboxRepo.getOldestCreatedAt(["new"])
            }
        };
    };
}
