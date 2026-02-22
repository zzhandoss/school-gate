import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const auditLogs = sqliteTable(
    "audit_logs",
    {
        id: text("id").primaryKey(),
        eventId: text("event_id"),

        actorId: text("actor_id").notNull(), // admin tgUserId
        action: text("action").notNull(), // string, пока без enum чтобы не душить миграциями
        entityType: text("entity_type").notNull(), // "subscription_request", "person", etc
        entityId: text("entity_id").notNull(),

        metaJson: text("meta_json"), // JSON.stringify(meta)

        at: integer("at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
    },
    (t) => ({
        eventUniq: uniqueIndex("audit_logs_event_id_unique").on(t.eventId),
        idxEntity: index("audit_logs_entity_idx").on(t.entityType, t.entityId),
        idxActorAt: index("audit_logs_actor_at_idx").on(t.actorId, t.at),
        idxAt: index("audit_logs_at_idx").on(t.at),
    })
);
