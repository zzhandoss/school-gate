import type { DeviceDirection } from "./devices.repo.js";

export type DeviceEvent = {
    id: string;
    deviceId: string;
    eventId: string;
    direction: DeviceDirection;
    occurredAt: Date;
    terminalPersonId: string | null;
    rawPayload: string | null;
    createdAt: Date;
};

export interface DeviceEventsRepo {
    insertIdempotent(input: {
        id: string;
        deviceId: string;
        eventId: string;
        direction: DeviceDirection;
        occurredAt: Date;
        terminalPersonId?: string | null;
        rawPayload?: string | null;
    }): "inserted" | "duplicate";
    listLastSeenByDeviceIds(deviceIds: string[]): { deviceId: string; lastEventAt: Date }[];
}
