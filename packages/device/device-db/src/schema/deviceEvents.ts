import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const deviceEvents = sqliteTable(
    "device_events",
    {
        id: text("id").primaryKey(),
        deviceId: text("device_id").notNull(),
        eventId: text("event_id").notNull(),
        direction: text("direction", { enum: ["IN", "OUT"] }).notNull(),
        occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),
        terminalPersonId: text("terminal_person_id"),
        rawPayload: text("raw_payload"),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (t) => ({
        uniqDeviceEvent: uniqueIndex("device_events_device_event_idx").on(t.deviceId, t.eventId),
        idxDeviceTime: index("device_events_device_time_idx").on(t.deviceId, t.occurredAt)
    })
);
