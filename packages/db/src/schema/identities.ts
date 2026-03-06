import { sqliteTable, text, uniqueIndex, integer, index } from "drizzle-orm/sqlite-core";
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

export const terminalDirectorySyncRuns = sqliteTable(
    "terminal_directory_sync_runs",
    {
        id: text("id").primaryKey(),
        requestedByAdminId: text("requested_by_admin_id"),
        status: text("status").notNull(),
        includeCards: integer("include_cards", { mode: "boolean" }).notNull().default(true),
        pageSize: integer("page_size").notNull(),
        targetJson: text("target_json").notNull(),
        deviceCount: integer("device_count").notNull().default(0),
        processedDeviceCount: integer("processed_device_count").notNull().default(0),
        entryCount: integer("entry_count").notNull().default(0),
        errorCount: integer("error_count").notNull().default(0),
        summaryJson: text("summary_json"),
        startedAt: integer("started_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
        finishedAt: integer("finished_at", { mode: "timestamp" })
    },
    (t) => ({
        syncRunsStartedAtIdx: index("tdsr_started_at_idx").on(t.startedAt),
        syncRunsStatusIdx: index("tdsr_status_idx").on(t.status)
    })
);

export const terminalDirectoryEntries = sqliteTable(
    "terminal_directory_entries",
    {
        id: text("id").primaryKey(),
        deviceId: text("device_id").notNull(),
        terminalPersonId: text("terminal_person_id").notNull(),
        iin: text("iin"),
        displayName: text("display_name"),
        userType: text("user_type"),
        userStatus: text("user_status"),
        authority: text("authority"),
        validFrom: text("valid_from"),
        validTo: text("valid_to"),
        cardNo: text("card_no"),
        cardName: text("card_name"),
        sourceSummaryJson: text("source_summary_json"),
        rawUserPayload: text("raw_user_payload"),
        rawCardPayload: text("raw_card_payload"),
        payloadHash: text("payload_hash").notNull(),
        isPresentInLastSync: integer("is_present_in_last_sync", { mode: "boolean" }).notNull().default(true),
        lastSeenAt: integer("last_seen_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
        lastSyncRunId: text("last_sync_run_id"),
        createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
        updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    },
    (t) => ({
        terminalDirectoryEntriesDeviceTerminalUnique: uniqueIndex("tde_device_terminal_unique").on(
            t.deviceId,
            t.terminalPersonId
        ),
        terminalDirectoryEntriesIinIdx: index("tde_iin_idx").on(t.iin),
        terminalDirectoryEntriesDeviceIdx: index("tde_device_idx").on(t.deviceId),
        terminalDirectoryEntriesPresentIdx: index("tde_present_idx").on(t.isPresentInLastSync),
        terminalDirectoryEntriesLastSeenIdx: index("tde_last_seen_idx").on(t.lastSeenAt)
    })
);
