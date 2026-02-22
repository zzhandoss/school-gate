import type { DeviceDirection } from "../repos/devices.repo.js";

export type AdapterAccessEvent = {
    eventId: string;
    deviceId: string;
    direction: DeviceDirection;
    occurredAt: Date;
    terminalPersonId?: string | null;
    rawPayload?: string | null;
};

export interface DeviceAdapterClient {
    fetchEvents(input: {
        deviceId: string;
        sinceEventId?: string | null;
        limit: number;
    }): Promise<AdapterAccessEvent[]>;
}
