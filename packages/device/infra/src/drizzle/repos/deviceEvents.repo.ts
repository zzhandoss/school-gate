import { deviceEvents } from "@school-gate/device/device-db/schema/deviceEvents";
import type { DeviceDb } from "@school-gate/device/device-db/drizzle";
import type { DeviceEventsRepo } from "@school-gate/device/core/repos/deviceEvents.repo";
import { inArray, max } from "drizzle-orm";

function isUniqueConstraintError(e: unknown): boolean {
    const msg = String((e as { message?: unknown } | null)?.message ?? "").toLowerCase();
    return msg.includes("unique") || msg.includes("constraint");
}

export function createDeviceEventsRepo(db: DeviceDb): DeviceEventsRepo {
    const insertIdempotent: DeviceEventsRepo["insertIdempotent"] = (input) => {
        try {
            db.insert(deviceEvents).values({
                id: input.id,
                deviceId: input.deviceId,
                eventId: input.eventId,
                direction: input.direction,
                occurredAt: input.occurredAt,
                terminalPersonId: input.terminalPersonId ?? null,
                rawPayload: input.rawPayload ?? null
            }).run();
            return "inserted";
        } catch (e) {
            if (isUniqueConstraintError(e)) return "duplicate";
            throw e;
        }
    };

    const listLastSeenByDeviceIds: DeviceEventsRepo["listLastSeenByDeviceIds"] = (deviceIds) => {
        if (deviceIds.length === 0) return [];
        const rows = db
            .select({
                deviceId: deviceEvents.deviceId,
                lastEventAt: max(deviceEvents.occurredAt)
            })
            .from(deviceEvents)
            .where(inArray(deviceEvents.deviceId, deviceIds))
            .groupBy(deviceEvents.deviceId)
            .all();

        return rows
            .map((row) => ({
                deviceId: row.deviceId,
                lastEventAt: row.lastEventAt ? new Date(row.lastEventAt) : null
            }))
            .filter((row): row is { deviceId: string; lastEventAt: Date } => row.lastEventAt !== null);
    };

    return {
        insertIdempotent,
        listLastSeenByDeviceIds
    };
}
