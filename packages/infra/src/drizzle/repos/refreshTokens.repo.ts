import { eq } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { refreshTokens } from "@school-gate/db/schema";
import type { RefreshToken, RefreshTokensRepo } from "@school-gate/core";

function toDate(value: unknown): Date {
    return value instanceof Date ? value : new Date(String(value));
}

function mapRefreshToken(row: typeof refreshTokens.$inferSelect): RefreshToken {
    return {
        id: row.id,
        adminId: row.adminId,
        tokenHash: row.tokenHash,
        createdAt: toDate(row.createdAt),
        expiresAt: toDate(row.expiresAt),
        rotatedAt: row.rotatedAt ? toDate(row.rotatedAt) : null,
        revokedAt: row.revokedAt ? toDate(row.revokedAt) : null,
        replacedBy: row.replacedBy ?? null,
        deviceId: row.deviceId ?? null,
        ip: row.ip ?? null,
        userAgent: row.userAgent ?? null
    };
}

export function createRefreshTokensRepo(db: Db): RefreshTokensRepo {
    return {
        withTx(tx) {
            return createRefreshTokensRepo(tx as Db);
        },
        async create(input) {
            await db.insert(refreshTokens).values({
                id: input.id,
                adminId: input.adminId,
                tokenHash: input.tokenHash,
                createdAt: input.createdAt,
                expiresAt: input.expiresAt,
                deviceId: input.deviceId ?? null,
                ip: input.ip ?? null,
                userAgent: input.userAgent ?? null
            });
        },
        async getById(id) {
            const rows = await db.select().from(refreshTokens).where(eq(refreshTokens.id, id)).limit(1);
            const row = rows[0];
            if (!row) {
                return null;
            }
            return mapRefreshToken(row);
        },
        async markRotated(input) {
            await db
                .update(refreshTokens)
                .set({
                    rotatedAt: input.rotatedAt,
                    replacedBy: input.replacedBy
                })
                .where(eq(refreshTokens.id, input.id));
        },
        async markRevoked(input) {
            await db
                .update(refreshTokens)
                .set({
                    revokedAt: input.revokedAt
                })
                .where(eq(refreshTokens.id, input.id));
        }
    };
}
