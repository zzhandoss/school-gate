import type { AdminAuth } from "../../../apps/api/src/delivery/http/middleware/adminAuth.js";
import type { AdminAuthModule } from "../../../apps/api/src/delivery/http/routes/adminAuth.routes.js";
import type { AdminsModule } from "../../../apps/api/src/delivery/http/routes/admins.routes.js";
import type { AlertsModule } from "../../../apps/api/src/delivery/http/routes/alerts.routes.js";
import type { AuditLogsModule } from "../../../apps/api/src/delivery/http/routes/auditLogs.routes.js";
import type { SubscriptionsModule } from "../../../apps/api/src/delivery/http/routes/subscriptions.routes.js";

export function createAllowAllAdminAuth(): AdminAuth {
    return {
        verify: async (c, next) => {
            c.set("admin", {
                adminId: "admin-1",
                roleId: "role-1",
                permissions: ["admin.manage"]
            });
            return next();
        },
        requirePermissions: () => async (_c, next) => next()
    };
}

export function createStubAdminAuthHandlers(): AdminAuthModule {
    return {
        login: async () => ({
            token: "token",
            expiresAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
            refreshToken: "refresh-token",
            refreshExpiresAt: new Date("2026-01-02T00:00:00.000Z").toISOString(),
            admin: {
                id: "admin-1",
                email: "admin@example.com",
                roleId: "role-1",
                status: "active",
                name: "Admin",
                tgUserId: null
            }
        }),
        requestTelegramLoginCode: async () => ({
            sent: true,
            expiresAt: new Date("2026-01-01T00:05:00.000Z").toISOString()
        }),
        loginWithTelegramCode: async () => ({
            token: "token",
            expiresAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
            refreshToken: "refresh-token",
            refreshExpiresAt: new Date("2026-01-02T00:00:00.000Z").toISOString(),
            admin: {
                id: "admin-1",
                email: "admin@example.com",
                roleId: "role-1",
                status: "active",
                name: "Admin",
                tgUserId: "1001"
            }
        }),
        refresh: async () => ({
            token: "token",
            expiresAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
            refreshToken: "refresh-token",
            refreshExpiresAt: new Date("2026-01-02T00:00:00.000Z").toISOString()
        }),
        session: async () => ({
            admin: {
                id: "admin-1",
                email: "admin@example.com",
                roleId: "role-1",
                status: "active",
                name: "Admin",
                tgUserId: null
            },
            roleId: "role-1",
            roleName: "super_admin",
            permissions: ["admin.manage"]
        }),
        updateMyProfile: async (input) => ({
            admin: {
                id: "admin-1",
                email: input.email,
                roleId: "role-1",
                status: "active",
                name: input.name ?? null,
                tgUserId: null
            }
        }),
        changeMyPassword: async (input) => ({ adminId: input.adminId }),
        logout: async () => {},
        bootstrapFirstAdmin: async () => ({ adminId: "admin-1", roleId: "role-1" }),
        createInvite: async () => ({
            token: "invite-token",
            roleId: "role-1",
            email: null,
            expiresAt: new Date("2026-01-01T00:00:00.000Z").toISOString()
        }),
        acceptInvite: async () => ({ adminId: "admin-1", roleId: "role-1" }),
        requestPasswordReset: async () => ({ token: null }),
        confirmPasswordReset: async () => ({ adminId: "admin-1" }),
        createTelegramLinkCode: async () => ({
            code: "link-code",
            expiresAt: new Date("2026-01-01T00:00:00.000Z").toISOString()
        }),
        linkTelegramByCode: async () => ({ adminId: "admin-1" }),
        unlinkTelegram: async () => ({ adminId: "admin-1" }),
        createRole: async () => ({ roleId: "role-1" }),
        updateRolePermissions: async (input) => ({ roleId: input.roleId }),
        listRoles: async () => ({ roles: [] }),
        listRolePermissions: async (roleId) => ({ roleId, permissions: [] }),
        listPermissions: async () => ({ permissions: [] })
    };
}

export function createStubAdminsHandlers(): AdminsModule {
    return {
        list: async () => ({ admins: [] }),
        setStatus: async () => {},
        setRole: async () => {},
        createPasswordReset: async () => ({
            token: "reset-token",
            expiresAt: new Date("2026-01-01T00:00:00.000Z")
        })
    };
}

export function createStubSubscriptionsHandlers(): SubscriptionsModule {
    return {
        list: async () => [],
        activate: async () => true,
        deactivate: async () => true
    };
}

export function createStubAuditLogsHandlers(): AuditLogsModule {
    return {
        list: async (input) => ({
            logs: [],
            page: {
                limit: input.limit,
                offset: input.offset,
                total: 0
            }
        })
    };
}

export function createStubAlertsHandlers(): AlertsModule {
    return {
        listRules: async () => [],
        createRule: async () => ({ ruleId: "rule-1" }),
        deleteRule: async (input) => ({ ruleId: input.ruleId, deleted: true }),
        updateRule: async () => {},
        listSubscriptions: async () => [],
        setSubscription: async () => {},
        listEvents: async (input) => ({
            events: [],
            page: {
                limit: input.limit,
                offset: input.offset,
                total: 0
            }
        })
    };
}

