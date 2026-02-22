import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const settings = sqliteTable("settings", {
    key: text("key").primaryKey(),
    value: text("value").notNull(), // строка; для сложных структур кладем JSON
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`)
});

export const parents = sqliteTable("parents", {
    tgUserId: text("tg_user_id").primaryKey(),   // хранить как string чтобы не упереться в number пределы
    chatId: text("chat_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`)
});

export const persons = sqliteTable(
    "persons",
    {
        id: text("id").primaryKey(), // uuid в виде строки (генерим на уровне приложения)
        iin: text("iin").notNull(),  // ИИН
        terminalPersonId: text("terminal_person_id"), // ID в Dahua (если есть)
        firstName: text("first_name"),
        lastName: text("last_name"),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (t) => ({
        iinUnique: uniqueIndex("persons_iin_unique").on(t.iin)
    })
);

export const workerHeartbeats = sqliteTable(
    "worker_heartbeats",
    {
        workerId: text("worker_id").primaryKey(),
        updatedAt: integer("updated_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
        lastStartedAt: integer("last_started_at", { mode: "timestamp" }),
        lastSuccessAt: integer("last_success_at", { mode: "timestamp" }),
        lastErrorAt: integer("last_error_at", { mode: "timestamp" }),
        lastError: text("last_error"),
        metaJson: text("meta_json")
    },
    (t) => ({
        idxUpdatedAt: index("worker_heartbeats_updated_at_idx").on(t.updatedAt),
        idxLastSuccessAt: index("worker_heartbeats_last_success_at_idx").on(t.lastSuccessAt),
        idxLastErrorAt: index("worker_heartbeats_last_error_at_idx").on(t.lastErrorAt)
    })
);

export const subscriptionRequests = sqliteTable(
    "subscription_requests",
    {
        id: text("id").primaryKey(),
        tgUserId: text("tg_user_id").notNull(),
        iin: text("iin").notNull(),
        status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull(),
        resolutionStatus: text("resolution_status", {
            enum: ["new", "ready_for_review", "needs_person"]
        })
            .notNull()
            .default("new"),
        personId: text("person_id"),
        resolutionMessage: text("resolution_message"),
        resolvedAt: integer("resolved_at", { mode: "timestamp" }),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
        reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
        reviewedBy: text("reviewed_by") // tgUserId админа
    },
    (t) => ({
        // Уникальность pending заявок: один и тот же родитель не может иметь две pending на один ИИН
        pendingUnique: uniqueIndex("subscription_requests_pending_unique")
            .on(t.tgUserId, t.iin)
            .where(sql`${t.status} = 'pending'`),
        resolutionIdx: index("subscription_requests_resolution_idx").on(t.status, t.resolutionStatus)
    })
);

export const subscriptions = sqliteTable(
    "subscriptions",
    {
        id: text("id").primaryKey(),
        tgUserId: text("tg_user_id").notNull(),
        personId: text("person_id").notNull(),
        isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (t) => ({
        uniq: uniqueIndex("subscriptions_unique").on(t.tgUserId, t.personId)
    })
);
