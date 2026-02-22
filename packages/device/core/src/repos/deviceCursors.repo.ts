export type DeviceCursor = {
    deviceId: string;
    lastAckedEventId: string;
    lastAckedAt: Date;
    updatedAt: Date;
};

export interface DeviceCursorsRepo {
    getByDeviceId(deviceId: string): DeviceCursor | null;
    upsertIfNewer(input: {
        deviceId: string;
        eventId: string;
        occurredAt: Date;
        updatedAt: Date;
    }): void;
}
