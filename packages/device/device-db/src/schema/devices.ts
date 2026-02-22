import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const devices = sqliteTable(
    "devices",
    {
        id: text("id").primaryKey(),
        name: text("name"),
        direction: text("direction", { enum: ["IN", "OUT"] }).notNull(),
        adapterKey: text("adapter_key").notNull(),
        settingsJson: text("settings_json"),
        enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
        updatedAt: integer("updated_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (t) => ({
        idxDirection: index("devices_direction_idx").on(t.direction),
        idxEnabled: index("devices_enabled_idx").on(t.enabled)
    })
);
