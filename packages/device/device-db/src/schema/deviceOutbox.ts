import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const deviceOutboxEvents = sqliteTable(
    "device_outbox_events",
    {
        id: text("id").primaryKey(),
        type: text("type").notNull(),
        payloadJson: text("payload_json").notNull(),
        status: text("status", { enum: ["new", "processing", "processed", "error"] })
            .notNull()
            .default("new"),
        attempts: integer("attempts").notNull().default(0),
        lastError: text("last_error"),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
        processingAt: integer("processing_at", { mode: "timestamp" }),
        processingBy: text("processing_by"),
        processedAt: integer("processed_at", { mode: "timestamp" })
    },
    (t) => ({
        idxStatusCreated: index("device_outbox_status_created_idx").on(t.status, t.createdAt),
        idxStatusProcessing: index("device_outbox_status_processing_idx").on(t.status, t.processingAt),
        idxType: index("device_outbox_type_idx").on(t.type)
    })
);
