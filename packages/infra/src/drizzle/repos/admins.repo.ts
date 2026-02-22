import { eq } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { admins } from "@school-gate/db/schema";
import type { Admin, AdminsRepo, AdminStatus } from "@school-gate/core";

function toDate(v: unknown): Date {
    return v instanceof Date ? v : new Date(String(v));
}

function mapAdmin(row: typeof admins.$inferSelect): Admin {
    return {
        id: row.id,
        email: row.email,
        passwordHash: row.passwordHash,
        roleId: row.roleId,
        status: row.status as AdminStatus,
        name: row.name ?? null,
        tgUserId: row.tgUserId ?? null,
        createdAt: toDate(row.createdAt),
        updatedAt: toDate(row.updatedAt)
    };
}

export function createAdminsRepo(db: Db): AdminsRepo {
    return {
        withTx(tx) {
            return createAdminsRepo(tx as Db);
        },
        async create(input) {
            await db.insert(admins).values({
                id: input.id,
                email: input.email,
                passwordHash: input.passwordHash,
                roleId: input.roleId,
                status: input.status,
                name: input.name ?? null,
                tgUserId: input.tgUserId ?? null,
                createdAt: input.createdAt,
                updatedAt: input.updatedAt
            });
        },

        async getById(id) {
            const rows = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
            const r = rows[0];
            if (!r) return null;
            return mapAdmin(r);
        },

        async getByEmail(email) {
            const rows = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
            const r = rows[0];
            if (!r) return null;
            return mapAdmin(r);
        },

        async getByTgUserId(tgUserId) {
            const rows = await db.select().from(admins).where(eq(admins.tgUserId, tgUserId)).limit(1);
            const r = rows[0];
            if (!r) return null;
            return mapAdmin(r);
        },

        async list({ limit, offset }) {
            const rows = await db.select().from(admins).limit(limit).offset(offset);
            return rows.map(mapAdmin);
        },

        async setPassword({ id, passwordHash, updatedAt }) {
            const res = db
                .update(admins)
                .set({ passwordHash, updatedAt })
                .where(eq(admins.id, id))
                .run();
            return res.changes > 0;
        },

        async setProfile({ id, email, name, updatedAt }) {
            const res = db
                .update(admins)
                .set({ email, name, updatedAt })
                .where(eq(admins.id, id))
                .run();
            return res.changes > 0;
        },

        async setTgUserId({ id, tgUserId, updatedAt }) {
            const res = db.update(admins).set({ tgUserId, updatedAt }).where(eq(admins.id, id)).run();
            return res.changes > 0;
        },

        async setStatus({ id, status, updatedAt }) {
            const res = db.update(admins).set({ status, updatedAt }).where(eq(admins.id, id)).run();
            return res.changes > 0;
        },

        async setRole({ id, roleId, updatedAt }) {
            const res = db.update(admins).set({ roleId, updatedAt }).where(eq(admins.id, id)).run();
            return res.changes > 0;
        }
    };
}
