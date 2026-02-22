import { eq } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { rolePermissions, roles } from "@school-gate/db/schema";
import type { Permission } from "@school-gate/core";
import { Role, RolesRepo } from "@school-gate/core";

function toDate(v: unknown): Date {
    return v instanceof Date ? v : new Date(String(v));
}

function mapRole(row: typeof roles.$inferSelect): Role {
    return {
        id: row.id,
        name: row.name,
        createdAt: toDate(row.createdAt),
        updatedAt: toDate(row.updatedAt),
    };
}

export function createRolesRepo(db: Db): RolesRepo {
    return {
        withTx(tx) {
            return createRolesRepo(tx as Db);
        },
        async upsert(input) {
            await db
                .insert(roles)
                .values({
                    id: input.id,
                    name: input.name,
                    createdAt: input.createdAt,
                    updatedAt: input.updatedAt,
                })
                .onConflictDoUpdate({
                    target: roles.id,
                    set: {
                        name: input.name,
                        updatedAt: input.updatedAt,
                    },
                });
        },

        async getById(id) {
            const rows = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
            const r = rows[0];
            if (!r) return null;
            return mapRole(r);
        },

        async getByName(name) {
            const rows = await db.select().from(roles).where(eq(roles.name, name)).limit(1);
            const r = rows[0];
            if (!r) return null;
            return mapRole(r);
        },

        async list() {
            const rows = await db.select().from(roles);
            return rows.map(mapRole);
        },

        async listPermissions(roleId) {
            const rows = await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, roleId));
            return rows.map((r) => r.permission) as Permission[];
        },

        async replacePermissions({ roleId, permissions }) {
            db.transaction((tx) => {
                tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId)).run();
                if (permissions.length === 0) return;
                tx.insert(rolePermissions)
                    .values(
                        permissions.map((permission) => ({
                            roleId,
                            permission,
                        }))
                    )
                    .run();
            });
        },
    };
}
