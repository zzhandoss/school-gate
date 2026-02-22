import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const deviceCursors = sqliteTable(
    "device_cursors",
    {
        deviceId: text("device_id").primaryKey(),
        lastAckedEventId: text("last_acked_event_id").notNull(),
        lastAckedAt: integer("last_acked_at", { mode: "timestamp" }).notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (t) => ({
        idxUpdatedAt: index("device_cursors_updated_at_idx").on(t.updatedAt)
    })
);
