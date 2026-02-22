import { eq } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { passwordResets } from "@school-gate/db/schema";
import type { PasswordReset, PasswordResetsRepo } from "@school-gate/core";

function toDate(v: unknown): Date {
    return v instanceof Date ? v : new Date(String(v));
}

function mapReset(row: typeof passwordResets.$inferSelect): PasswordReset {
    return {
        tokenHash: row.tokenHash,
        adminId: row.adminId,
        expiresAt: toDate(row.expiresAt),
        usedAt: row.usedAt ? toDate(row.usedAt) : null,
        createdAt: toDate(row.createdAt),
    };
}

export function createPasswordResetsRepo(db: Db): PasswordResetsRepo {
    return {
        withTx(tx) {
            return createPasswordResetsRepo(tx as Db);
        },
        async create(input) {
            await db.insert(passwordResets).values({
                tokenHash: input.tokenHash,
                adminId: input.adminId,
                expiresAt: input.expiresAt,
                usedAt: input.usedAt ?? null,
                createdAt: input.createdAt,
            });
        },

        async getByTokenHash(tokenHash) {
            const rows = await db
                .select()
                .from(passwordResets)
                .where(eq(passwordResets.tokenHash, tokenHash))
                .limit(1);
            const r = rows[0];
            if (!r) return null;
            return mapReset(r);
        },

        async markUsed({ tokenHash, usedAt }) {
            const res = db
                .update(passwordResets)
                .set({ usedAt })
                .where(eq(passwordResets.tokenHash, tokenHash))
                .run();
            return res.changes > 0;
        },
    };
}
