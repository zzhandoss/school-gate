import { eq } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { adminInvites } from "@school-gate/db/schema";
import type { AdminInvitesRepo, AdminInvite } from "@school-gate/core";

function toDate(v: unknown): Date {
    return v instanceof Date ? v : new Date(String(v));
}

function mapInvite(row: typeof adminInvites.$inferSelect): AdminInvite {
    return {
        tokenHash: row.tokenHash,
        roleId: row.roleId,
        email: row.email ?? null,
        createdBy: row.createdBy,
        expiresAt: toDate(row.expiresAt),
        usedAt: row.usedAt ? toDate(row.usedAt) : null,
        createdAt: toDate(row.createdAt),
    };
}

export function createAdminInvitesRepo(db: Db): AdminInvitesRepo {
    return {
        withTx(tx) {
            return createAdminInvitesRepo(tx as Db);
        },
        async create(input) {
            await db.insert(adminInvites).values({
                tokenHash: input.tokenHash,
                roleId: input.roleId,
                email: input.email ?? null,
                createdBy: input.createdBy,
                expiresAt: input.expiresAt,
                usedAt: input.usedAt ?? null,
                createdAt: input.createdAt,
            });
        },

        async getByTokenHash(tokenHash) {
            const rows = await db
                .select()
                .from(adminInvites)
                .where(eq(adminInvites.tokenHash, tokenHash))
                .limit(1);
            const r = rows[0];
            if (!r) return null;
            return mapInvite(r);
        },

        async markUsed({ tokenHash, usedAt }) {
            const res = db
                .update(adminInvites)
                .set({ usedAt })
                .where(eq(adminInvites.tokenHash, tokenHash))
                .run();
            return res.changes > 0;
        },
    };
}
