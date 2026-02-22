import { eq } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { adminTgCodes } from "@school-gate/db/schema";
import type { AdminTgCodesRepo, AdminTgCode } from "@school-gate/core";

function toDate(v: unknown): Date {
    return v instanceof Date ? v : new Date(String(v));
}

function mapCode(row: typeof adminTgCodes.$inferSelect): AdminTgCode {
    return {
        codeHash: row.codeHash,
        adminId: row.adminId,
        purpose: row.purpose,
        expiresAt: toDate(row.expiresAt),
        usedAt: row.usedAt ? toDate(row.usedAt) : null,
        createdAt: toDate(row.createdAt),
    };
}

export function createAdminTgCodesRepo(db: Db): AdminTgCodesRepo {
    return {
        withTx(tx) {
            return createAdminTgCodesRepo(tx as Db);
        },
        async create(input) {
            await db.insert(adminTgCodes).values({
                codeHash: input.codeHash,
                adminId: input.adminId,
                purpose: input.purpose,
                expiresAt: input.expiresAt,
            });
        },

        async getByCodeHash(codeHash) {
            const rows = await db
                .select()
                .from(adminTgCodes)
                .where(eq(adminTgCodes.codeHash, codeHash))
                .limit(1);
            const r = rows[0];
            if (!r) return null;
            return mapCode(r);
        },

        async markUsed({ codeHash, usedAt }) {
            const res = db.update(adminTgCodes).set({ usedAt }).where(eq(adminTgCodes.codeHash, codeHash)).run();
            return res.changes > 0;
        },
    };
}
