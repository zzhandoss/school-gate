import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const roles = sqliteTable(
    "roles",
    {
        id: text("id").primaryKey(),
        name: text("name").notNull(),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
        updatedAt: integer("updated_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (t) => ({
        nameUnique: uniqueIndex("roles_name_unique").on(t.name)
    })
);

export const rolePermissions = sqliteTable(
    "role_permissions",
    {
        roleId: text("role_id")
            .notNull()
            .references(() => roles.id, { onDelete: "cascade" }),
        permission: text("permission").notNull()
    },
    (t) => ({
        pk: primaryKey({ columns: [t.roleId, t.permission] }),
        roleIdx: index("role_permissions_role_id_idx").on(t.roleId)
    })
);

export const admins = sqliteTable(
    "admins",
    {
        id: text("id").primaryKey(),
        email: text("email").notNull(),
        passwordHash: text("password_hash").notNull(),
        roleId: text("role_id")
            .notNull()
            .references(() => roles.id),
        status: text("status", { enum: ["pending", "active", "disabled"] })
            .notNull()
            .default("pending"),
        name: text("name"),
        tgUserId: text("tg_user_id"),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
        updatedAt: integer("updated_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (t) => ({
        emailUnique: uniqueIndex("admins_email_unique").on(t.email),
        tgUserIdUnique: uniqueIndex("admins_tg_user_id_unique").on(t.tgUserId),
        roleIdx: index("admins_role_id_idx").on(t.roleId)
    })
);

export const adminInvites = sqliteTable(
    "admin_invites",
    {
        tokenHash: text("token_hash").primaryKey(),
        roleId: text("role_id")
            .notNull()
            .references(() => roles.id),
        email: text("email"),
        createdBy: text("created_by")
            .notNull()
            .references(() => admins.id),
        expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
        usedAt: integer("used_at", { mode: "timestamp" }),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (t) => ({
        roleIdx: index("admin_invites_role_id_idx").on(t.roleId),
        createdByIdx: index("admin_invites_created_by_idx").on(t.createdBy),
        emailIdx: index("admin_invites_email_idx").on(t.email)
    })
);

export const passwordResets = sqliteTable(
    "password_resets",
    {
        tokenHash: text("token_hash").primaryKey(),
        adminId: text("admin_id")
            .notNull()
            .references(() => admins.id, { onDelete: "cascade" }),
        expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
        usedAt: integer("used_at", { mode: "timestamp" }),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (t) => ({
        adminIdx: index("password_resets_admin_id_idx").on(t.adminId)
    })
);

export const adminTgCodes = sqliteTable(
    "admin_tg_codes",
    {
        codeHash: text("code_hash").primaryKey(),
        adminId: text("admin_id")
            .notNull()
            .references(() => admins.id, { onDelete: "cascade" }),
        purpose: text("purpose", { enum: ["link", "login"] })
            .notNull()
            .default("link"),
        expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
        usedAt: integer("used_at", { mode: "timestamp" }),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`)
    },
    (t) => ({
        adminIdx: index("admin_tg_codes_admin_id_idx").on(t.adminId)
    })
);
export const refreshTokens = sqliteTable(
    "refresh_tokens",
    {
        id: text("id").primaryKey(),
        adminId: text("admin_id")
            .notNull()
            .references(() => admins.id, { onDelete: "cascade" }),
        tokenHash: text("token_hash").notNull(),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
        expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
        rotatedAt: integer("rotated_at", { mode: "timestamp" }),
        revokedAt: integer("revoked_at", { mode: "timestamp" }),
        replacedBy: text("replaced_by"),
        deviceId: text("device_id"),
        ip: text("ip"),
        userAgent: text("user_agent")
    },
    (t) => ({
        adminIdx: index("refresh_tokens_admin_id_idx").on(t.adminId),
        expiresIdx: index("refresh_tokens_expires_at_idx").on(t.expiresAt)
    })
);
