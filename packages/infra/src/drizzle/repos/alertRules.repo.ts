import { and, desc, eq } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { alertRules } from "@school-gate/db/schema";
import { AlertRulesRepo, AlertRuleType, UnknownAlertRule, parseAlertRuleConfig } from "@school-gate/core";
function toDate(value: unknown): Date {
    return value instanceof Date ? value : new Date(String(value));
}

function mapRule(row: typeof alertRules.$inferSelect): UnknownAlertRule {
    const type = row.type as AlertRuleType;
    const config = parseAlertRuleConfig(type, JSON.parse(row.configJson));
    return {
        id: row.id,
        name: row.name,
        type,
        severity: row.severity as UnknownAlertRule["severity"],
        isEnabled: Boolean(row.isEnabled),
        config,
        createdAt: toDate(row.createdAt),
        updatedAt: toDate(row.updatedAt),
    } as UnknownAlertRule;
}

export function createAlertRulesRepo(db: Db): AlertRulesRepo {
    return {
        async create(input) {
            db.insert(alertRules)
                .values({
                    id: input.id,
                    name: input.name,
                    type: input.type,
                    severity: input.severity,
                    isEnabled: input.isEnabled,
                    configJson: JSON.stringify(input.config),
                    createdAt: input.createdAt,
                    updatedAt: input.updatedAt,
                })
                .run();
        },

        async update(input) {
            const update: Record<string, unknown> = { updatedAt: input.updatedAt };
            if (input.name !== undefined) update.name = input.name;
            if (input.severity !== undefined) update.severity = input.severity;
            if (input.isEnabled !== undefined) update.isEnabled = input.isEnabled;
            if (input.config !== undefined) update.configJson = JSON.stringify(input.config);

            const res = db
                .update(alertRules)
                .set(update)
                .where(eq(alertRules.id, input.id))
                .run();
            return res.changes > 0;
        },

        async getById(id) {
            const row = db.select().from(alertRules).where(eq(alertRules.id, id)).limit(1).get();
            return row ? mapRule(row) : null;
        },

        async list(input) {
            const conditions = [];
            if (input.onlyEnabled !== undefined) {
                conditions.push(eq(alertRules.isEnabled, input.onlyEnabled));
            }

            const query = conditions.length
                ? db.select().from(alertRules).where(and(...conditions))
                : db.select().from(alertRules);

            const rows = query
                .orderBy(desc(alertRules.createdAt))
                .limit(input.limit)
                .offset(input.offset)
                .all();
            return rows.map(mapRule);
        },
        withTx(tx) {
            return createAlertRulesRepo(tx as Db);
        },

    };
}

