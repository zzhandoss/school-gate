import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { admins } from "./admin.js";
import { monitoringSnapshots } from "./monitoring.js";

export const alertRules = sqliteTable(
    "alert_rules",
    {
        id: text("id").primaryKey(),
        name: text("name").notNull(),
        type: text("type").notNull(),
        severity: text("severity", { enum: ["warning", "critical"] }).notNull(),
        isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
        configJson: text("config_json").notNull(),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
        updatedAt: integer("updated_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
    },
    (t) => ({
        typeIdx: index("alert_rules_type_idx").on(t.type),
        enabledIdx: index("alert_rules_enabled_idx").on(t.isEnabled),
    })
);

export const alertSubscriptions = sqliteTable(
    "alert_subscriptions",
    {
        adminId: text("admin_id")
            .notNull()
            .references(() => admins.id, { onDelete: "cascade" }),
        ruleId: text("rule_id")
            .notNull()
            .references(() => alertRules.id, { onDelete: "cascade" }),
        isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
        updatedAt: integer("updated_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
    },
    (t) => ({
        pk: primaryKey({ columns: [t.adminId, t.ruleId] }),
        adminIdx: index("alert_subscriptions_admin_id_idx").on(t.adminId),
        ruleIdx: index("alert_subscriptions_rule_id_idx").on(t.ruleId),
        enabledIdx: index("alert_subscriptions_enabled_idx").on(t.isEnabled),
    })
);

export const alertEvents = sqliteTable(
    "alert_events",
    {
        id: text("id").primaryKey(),
        ruleId: text("rule_id")
            .notNull()
            .references(() => alertRules.id, { onDelete: "cascade" }),
        snapshotId: text("snapshot_id").references(() => monitoringSnapshots.id, { onDelete: "set null" }),
        status: text("status", { enum: ["triggered", "resolved"] }).notNull(),
        severity: text("severity", { enum: ["warning", "critical"] }).notNull(),
        message: text("message").notNull(),
        detailsJson: text("details_json"),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
    },
    (t) => ({
        ruleIdx: index("alert_events_rule_id_idx").on(t.ruleId),
        statusIdx: index("alert_events_status_idx").on(t.status),
        createdIdx: index("alert_events_created_at_idx").on(t.createdAt),
    })
);
