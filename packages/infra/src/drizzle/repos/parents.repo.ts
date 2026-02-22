import { eq } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { parents } from "@school-gate/db/schema";
import type { Parent, ParentsRepo } from "@school-gate/core";

function toDate(v: unknown): Date {
    return v instanceof Date ? v : new Date(String(v));
}

export function createParentsRepo(db: Db): ParentsRepo {
    return {
        async upsert({ tgUserId, chatId }) {
            await db
                .insert(parents)
                .values({ tgUserId, chatId })
                .onConflictDoUpdate({
                    target: parents.tgUserId,
                    set: { chatId }
                });
        },

        async getByTgUserId(tgUserId) {
            const rows = await db.select().from(parents).where(eq(parents.tgUserId, tgUserId)).limit(1);
            const row = rows[0];
            if (!row) return null;

            return {
                tgUserId: row.tgUserId,
                chatId: row.chatId,
                createdAt: toDate(row.createdAt)
            } satisfies Parent;
        },
        withTx(tx) {
            return createParentsRepo(tx as Db);
        }

    };
}

