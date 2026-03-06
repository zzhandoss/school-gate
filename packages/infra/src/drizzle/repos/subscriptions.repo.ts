import { and, eq } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { subscriptions } from "@school-gate/db/schema";
import type {
    Subscription,
    SubscriptionsRepo
} from "@school-gate/core";

function toDate(v: unknown): Date {
    return v instanceof Date ? v : new Date(String(v));
}

export function createSubscriptionsRepo(db: Db): SubscriptionsRepo {
    return {
        async upsertActive({ id, tgUserId, personId }) {
            // Р’Р°Р¶РЅРѕ: РµСЃР»Рё РїРѕРґРїРёСЃРєР° СѓР¶Рµ РµСЃС‚СЊ, РЅРѕ isActive=false вЂ” Р°РєС‚РёРІРёСЂСѓРµРј РѕР±СЂР°С‚РЅРѕ
            await db
                .insert(subscriptions)
                .values({
                    id,
                    tgUserId,
                    personId,
                    isActive: true
                })
                .onConflictDoUpdate({
                    target: [subscriptions.tgUserId, subscriptions.personId],
                    set: { isActive: true }
                });
        },

        upsertActiveSync({ id, tgUserId, personId }) {
            db
                .insert(subscriptions)
                .values({
                    id,
                    tgUserId,
                    personId,
                    isActive: true
                })
                .onConflictDoUpdate({
                    target: [subscriptions.tgUserId, subscriptions.personId],
                    set: { isActive: true }
                })
                .run();
        },

        async listActiveByPersonId(personId) {
            const rows = await db
                .select()
                .from(subscriptions)
                .where(and(eq(subscriptions.personId, personId), eq(subscriptions.isActive, true)));

            return rows.map((r) => ({
                id: r.id,
                tgUserId: r.tgUserId,
                personId: r.personId,
                isActive: Boolean(r.isActive),
                createdAt: toDate(r.createdAt)
            })) satisfies Subscription[];
        },

        async listByTgUserId({ tgUserId, onlyActive }) {
            const where = onlyActive
                ? and(eq(subscriptions.tgUserId, tgUserId), eq(subscriptions.isActive, true))
                : eq(subscriptions.tgUserId, tgUserId);

            const rows = await db.select().from(subscriptions).where(where);

            return rows.map((r) => ({
                id: r.id,
                tgUserId: r.tgUserId,
                personId: r.personId,
                isActive: Boolean(r.isActive),
                createdAt: toDate(r.createdAt)
            })) satisfies Subscription[];
        },
        async getById(id) {
            const rows = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
            const row = rows[0];
            if (!row) return null;

            return {
                id: row.id,
                tgUserId: row.tgUserId,
                personId: row.personId,
                isActive: Boolean(row.isActive),
                createdAt: toDate(row.createdAt)
            } satisfies Subscription;
        },
        getByIdSync(id) {
            const rows = db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1).all();
            const row = rows[0];
            if (!row) return null;

            return {
                id: row.id,
                tgUserId: row.tgUserId,
                personId: row.personId,
                isActive: Boolean(row.isActive),
                createdAt: toDate(row.createdAt)
            } satisfies Subscription;
        },

        async deactivate({ tgUserId, personId }) {
            await db
                .update(subscriptions)
                .set({ isActive: false })
                .where(and(eq(subscriptions.tgUserId, tgUserId), eq(subscriptions.personId, personId)));
        },

        deactivateByPersonIdSync({ personId }) {
            const rows = db
                .select({ id: subscriptions.id })
                .from(subscriptions)
                .where(and(eq(subscriptions.personId, personId), eq(subscriptions.isActive, true)))
                .all();

            if (rows.length === 0) {
                return 0;
            }

            db
                .update(subscriptions)
                .set({ isActive: false })
                .where(and(eq(subscriptions.personId, personId), eq(subscriptions.isActive, true)))
                .run();

            return rows.length;
        },

        setActiveByIdSync({ id, isActive }) {
            const rows = db.select({ id: subscriptions.id }).from(subscriptions).where(eq(subscriptions.id, id)).limit(1).all();
            if (!rows[0]) return false;

            db.update(subscriptions).set({ isActive }).where(eq(subscriptions.id, id)).run();
            return true;
        },
        withTx(tx) {
            return createSubscriptionsRepo(tx as Db);
        }

    };
}

