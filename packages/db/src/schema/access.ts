import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const accessEvents = sqliteTable(
    "access_events",
    {
        id: text("id").primaryKey(),
        deviceId: text("device_id").notNull(),
        direction: text("direction", { enum: ["IN", "OUT"] }).notNull(),
        occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),

        iin: text("iin"),
        terminalPersonId: text("terminal_person_id"),

        idempotencyKey: text("idempotency_key").notNull(), // дедуп ключ
        rawPayload: text("raw_payload"), // JSON string

        status: text("status", { enum: ["NEW", "PROCESSING", "PROCESSED", "FAILED_RETRY", "UNMATCHED", "ERROR"] })
            .notNull()
            .default("NEW"),

        attempts: integer("attempts").notNull().default(0),
        nextAttemptAt: integer("next_attempt_at", { mode: "timestamp" }),
        processingAt: integer("processing_at", { mode: "timestamp" }),
        processingBy: text("processing_by"),
        lastError: text("last_error"),

        processedAt: integer("processed_at", { mode: "timestamp" }),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (t) => ({
        idemUniq: uniqueIndex("access_events_idempotency_unique").on(t.idempotencyKey),
        deviceTimeIdx: index("access_events_device_time_idx").on(t.deviceId, t.occurredAt),
        statusIdx: index("access_events_status_idx").on(t.status),
        nextAttemptIdx: index("access_events_next_attempt_idx").on(t.nextAttemptAt),
        processingIdx: index("access_events_processing_idx").on(t.processingAt)
    })
);
