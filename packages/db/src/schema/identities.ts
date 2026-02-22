import { sqliteTable, text, uniqueIndex, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const personTerminalIdentities = sqliteTable(
    "person_terminal_identities",
    {
        id: text("id").primaryKey(), // uuid string
        personId: text("person_id").notNull(),
        deviceId: text("device_id").notNull(),
        terminalPersonId: text("terminal_person_id").notNull(),

        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (t) => ({
        // На одном устройстве terminalPersonId должен быть уникален
        uniqDeviceTerminal: uniqueIndex("pti_device_terminal_unique").on(t.deviceId, t.terminalPersonId),

        // У одной персоны на одном устройстве — максимум одна “учетка”
        uniqPersonDevice: uniqueIndex("pti_person_device_unique").on(t.personId, t.deviceId)
    })
);
