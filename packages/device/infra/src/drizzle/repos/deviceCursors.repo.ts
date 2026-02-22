import { eq } from "drizzle-orm";
import { deviceCursors } from "@school-gate/device/device-db/schema";
import type { DeviceDb } from "@school-gate/device/device-db/drizzle";
import type { DeviceCursor, DeviceCursorsRepo } from "@school-gate/device/core/repos/deviceCursors.repo";

function toDate(value: unknown): Date {
    return value instanceof Date ? value : new Date(String(value));
}

export function createDeviceCursorsRepo(db: DeviceDb): DeviceCursorsRepo {
    const getByDeviceId: DeviceCursorsRepo["getByDeviceId"] = (deviceId) => {
        const row = db
            .select()
            .from(deviceCursors)
            .where(eq(deviceCursors.deviceId, deviceId))
            .get();

        if (!row) return null;

        return {
            deviceId: row.deviceId,
            lastAckedEventId: row.lastAckedEventId,
            lastAckedAt: toDate(row.lastAckedAt),
            updatedAt: toDate(row.updatedAt)
        } satisfies DeviceCursor;
    };

    const upsertIfNewer: DeviceCursorsRepo["upsertIfNewer"] = (input) => {
        const existing = db
            .select({
                lastAckedAt: deviceCursors.lastAckedAt
            })
            .from(deviceCursors)
            .where(eq(deviceCursors.deviceId, input.deviceId))
            .get();

        if (existing) {
            const current = toDate(existing.lastAckedAt);
            if (input.occurredAt < current) {
                return;
            }

            db
                .update(deviceCursors)
                .set({
                    lastAckedEventId: input.eventId,
                    lastAckedAt: input.occurredAt,
                    updatedAt: input.updatedAt
                })
                .where(eq(deviceCursors.deviceId, input.deviceId))
                .run();
            return;
        }

        db.insert(deviceCursors).values({
            deviceId: input.deviceId,
            lastAckedEventId: input.eventId,
            lastAckedAt: input.occurredAt,
            updatedAt: input.updatedAt
        }).run();
    };

    return {
        getByDeviceId,
        upsertIfNewer
    };
}
