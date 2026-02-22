import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { admins, alertSubscriptions } from "@school-gate/db/schema";
import type { AlertSubscriptionsRepo, AlertRecipient, AlertSubscription } from "@school-gate/core";

function toDate(value: unknown): Date {
    return value instanceof Date ? value : new Date(String(value));
}

function mapSubscription(row: typeof alertSubscriptions.$inferSelect): AlertSubscription {
    return {
        adminId: row.adminId,
        ruleId: row.ruleId,
        isEnabled: Boolean(row.isEnabled),
        createdAt: toDate(row.createdAt),
        updatedAt: toDate(row.updatedAt)
    };
}

export function createAlertSubscriptionsRepo(db: Db): AlertSubscriptionsRepo {
    return {
        async upsert(input) {
            db.insert(alertSubscriptions)
                .values({
                    adminId: input.adminId,
                    ruleId: input.ruleId,
                    isEnabled: input.isEnabled,
                    createdAt: input.createdAt,
                    updatedAt: input.updatedAt
                })
                .onConflictDoUpdate({
                    target: [alertSubscriptions.adminId, alertSubscriptions.ruleId],
                    set: {
                        isEnabled: input.isEnabled,
                        updatedAt: input.updatedAt
                    }
                })
                .run();
        },

        async list(input) {
            const conditions = [];
            if (input.adminId) conditions.push(eq(alertSubscriptions.adminId, input.adminId));
            if (input.ruleId) conditions.push(eq(alertSubscriptions.ruleId, input.ruleId));
            if (input.onlyEnabled !== undefined) {
                conditions.push(eq(alertSubscriptions.isEnabled, input.onlyEnabled));
            }

            const query = conditions.length
                ? db.select().from(alertSubscriptions).where(and(...conditions))
                : db.select().from(alertSubscriptions);

            const rows = query
                .orderBy(desc(alertSubscriptions.createdAt))
                .limit(input.limit)
                .offset(input.offset)
                .all();

            return rows.map(mapSubscription);
        },

        async listRecipientsByRuleIds(input) {
            if (input.ruleIds.length === 0) return [];

            const conditions = [
                inArray(alertSubscriptions.ruleId, input.ruleIds),
                isNotNull(admins.tgUserId),
                eq(admins.status, "active")
            ];
            if (input.onlyEnabled !== undefined) {
                conditions.push(eq(alertSubscriptions.isEnabled, input.onlyEnabled));
            }

            const rows = db
                .select({
                    adminId: alertSubscriptions.adminId,
                    ruleId: alertSubscriptions.ruleId,
                    tgUserId: admins.tgUserId
                })
                .from(alertSubscriptions)
                .innerJoin(admins, eq(alertSubscriptions.adminId, admins.id))
                .where(and(...conditions))
                .all();

            return rows.map((row) => ({
                adminId: row.adminId,
                ruleId: row.ruleId,
                tgUserId: row.tgUserId as string
            })) satisfies AlertRecipient[];
        },
        withTx(tx) {
            return createAlertSubscriptionsRepo(tx as Db);
        }

    };
}

