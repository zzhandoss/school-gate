import { beforeAll, describe, expect, it } from "vitest";
import type { AdminAccess } from "@school-gate/core";
import { createLogger } from "@school-gate/infra/logging/logger";
import { createApiApp } from "../../../apps/api/src/app.js";
import { signAdminJwt } from "../../../apps/api/src/delivery/http/adminJwt.js";
import { createAdminAuth } from "../../../apps/api/src/delivery/http/middleware/adminAuth.js";
import {
    createStubAlertsHandlers,
    createStubAdminsHandlers,
    createStubAuditLogsHandlers,
    createStubSubscriptionsHandlers
} from "../helpers/adminAuth.js";
import { createEmptyPersonsModule } from "../helpers/personsModule.js";

type JwtInput = {
    adminId: string;
    roleId?: string;
    permissions?: AdminAccess["permissions"];
};

describe("API auth cookies", () => {
    const jwtSecret = "test-admin-jwt-secret-32-chars-min!";
    const accessTtlMs = 10 * 60_000;
    const refreshTtlMs = 30 * 24 * 60 * 60 * 1000;
    const roleId = "role-admin";
    const permissions = ["admin.manage"] as AdminAccess["permissions"];
    let app: ReturnType<typeof createApiApp>;
    const logoutTokens: string[] = [];
    const getSetCookieHeader = (response: Response) => {
        const rawHeaders = response.headers as Headers & { getSetCookie?: () => string[] };
        if (typeof rawHeaders.getSetCookie === "function") {
            return rawHeaders.getSetCookie().join("; ");
        }
        return response.headers.get("set-cookie") ?? "";
    };

    const makeToken = async (input: JwtInput) => {
        return signAdminJwt({
            secret: jwtSecret,
            ttlMs: accessTtlMs,
            payload: {
                adminId: input.adminId,
                roleId: input.roleId ?? roleId,
                permissions: input.permissions ?? permissions
            }
        });
    };

    beforeAll(() => {
        const adminAuth = createAdminAuth({
            jwtSecret,
            getAdminAccess: async (adminId) => ({
                adminId,
                roleId,
                permissions
            }),
            cookies: {
                accessCookieName: "sg_admin_access",
                refreshCookieName: "sg_admin_refresh",
                path: "/",
                secure: true,
                sameSite: "lax"
            }
        });

        app = createApiApp({
            logger: createLogger({ name: "api-auth-cookies-test", level: "silent" }),
            corsAllowedOrigins: ["http://localhost:5000"],
            adminAccessTtlMs: accessTtlMs,
            adminRefreshTtlMs: refreshTtlMs,
            authCookies: {
                accessCookieName: "sg_admin_access",
                refreshCookieName: "sg_admin_refresh",
                path: "/",
                secure: true,
                sameSite: "lax"
            },
            adminAuth,
            adminAuthModule: {
                login: async () => {
                    const token = await makeToken({ adminId: "admin-1" });
                    return {
                        token,
                        expiresAt: new Date("2026-01-01T00:10:00.000Z").toISOString(),
                        refreshToken: "refresh-login-1",
                        refreshExpiresAt: new Date("2026-01-31T00:00:00.000Z").toISOString(),
                        admin: {
                            id: "admin-1",
                            email: "admin@example.com",
                            roleId,
                            status: "active",
                            name: "Admin",
                            tgUserId: null
                        }
                    };
                },
                requestTelegramLoginCode: async () => ({
                    sent: true,
                    expiresAt: new Date("2026-01-01T00:05:00.000Z").toISOString()
                }),
                loginWithTelegramCode: async () => {
                    const token = await makeToken({ adminId: "admin-1" });
                    return {
                        token,
                        expiresAt: new Date("2026-01-01T00:10:00.000Z").toISOString(),
                        refreshToken: "refresh-tg-login-1",
                        refreshExpiresAt: new Date("2026-01-31T00:00:00.000Z").toISOString(),
                        admin: {
                            id: "admin-1",
                            email: "admin@example.com",
                            roleId,
                            status: "active",
                            name: "Admin",
                            tgUserId: "1001"
                        }
                    };
                },
                refresh: async (input) => {
                    const token = await makeToken({ adminId: "admin-1" });
                    return {
                        token,
                        expiresAt: new Date("2026-01-01T00:20:00.000Z").toISOString(),
                        refreshToken: `${input.refreshToken}-rotated`,
                        refreshExpiresAt: new Date("2026-01-31T00:00:00.000Z").toISOString()
                    };
                },
                session: async () => ({
                    admin: {
                        id: "admin-1",
                        email: "admin@example.com",
                        roleId,
                        status: "active",
                        name: "Admin",
                        tgUserId: null
                    },
                    roleId,
                    roleName: "super_admin",
                    permissions
                }),
                updateMyProfile: async (input) => ({
                    admin: {
                        id: "admin-1",
                        email: input.email,
                        roleId,
                        status: "active",
                        name: input.name ?? null,
                        tgUserId: null
                    }
                }),
                changeMyPassword: async (input) => ({ adminId: input.adminId }),
                logout: async (refreshToken) => {
                    logoutTokens.push(refreshToken);
                },
                bootstrapFirstAdmin: async () => ({ adminId: "admin-1", roleId }),
                createInvite: async () => ({
                    token: "invite-token",
                    roleId,
                    email: null,
                    expiresAt: new Date("2026-01-01T00:00:00.000Z").toISOString()
                }),
                acceptInvite: async () => ({ adminId: "admin-1", roleId }),
                requestPasswordReset: async () => ({ token: null }),
                confirmPasswordReset: async () => ({ adminId: "admin-1" }),
                createTelegramLinkCode: async () => ({
                    code: "code-1",
                    expiresAt: new Date("2026-01-01T00:00:00.000Z").toISOString()
                }),
                linkTelegramByCode: async () => ({ adminId: "admin-1" }),
                unlinkTelegram: async () => ({ adminId: "admin-1" }),
                createRole: async () => ({ roleId }),
                updateRolePermissions: async (input) => ({ roleId: input.roleId }),
                listRoles: async () => ({ roles: [] }),
                listRolePermissions: async (roleIdInput) => ({ roleId: roleIdInput, permissions: [] }),
                listPermissions: async () => ({ permissions: [] })
            },
            admins: createStubAdminsHandlers(),
            runtimeSettings: {
                list: () => ({} as never),
                set: () => ({ updated: 0 })
            },
            accessEvents: {
                verifyIngestAuth: async (_c, next) => next(),
                module: {
                    ingest: async () => ({
                        result: "duplicate",
                        status: "NEW",
                        personId: null,
                        accessEventId: null
                    })
                }
            },
            accessEventsAdmin: {
                listUnmatched: async () => [],
                mapTerminalIdentity: async () => ({ status: "already_linked", updatedEvents: 0 })
            },
            persons: createEmptyPersonsModule(),
            subscriptionRequests: {
                listPending: async () => ({ requests: [], page: { limit: 50, offset: 0, total: 0 } }),
                review: async () => ({ requestId: "r-1", status: "rejected", personId: null })
            },
            subscriptions: createStubSubscriptionsHandlers(),
            retention: {
                applySchedule: async () => ({ taskName: "retention", platform: process.platform, pollMs: 300000, intervalMinutes: 5 }),
                removeSchedule: async () => ({ taskName: "retention", platform: process.platform, removed: true }),
                runOnce: async () => ({
                    accessEventsDeleted: 0,
                    auditLogsDeleted: 0,
                    accessEventsCutoff: new Date("2026-01-01T00:00:00.000Z"),
                    auditLogsCutoff: new Date("2026-01-01T00:00:00.000Z"),
                    batch: 100,
                    accessEventsDays: 30,
                    auditLogsDays: 30
                })
            },
            monitoring: {
                getSnapshot: async () => ({
                    now: new Date("2026-01-01T00:00:00.000Z"),
                    accessEvents: {
                        counts: { NEW: 0, PROCESSING: 0, PROCESSED: 0, FAILED_RETRY: 0, UNMATCHED: 0, ERROR: 0 },
                        oldestUnprocessedOccurredAt: null
                    },
                    outbox: { counts: { new: 0, processing: 0, processed: 0, error: 0 }, oldestNewCreatedAt: null },
                    workers: [],
                    topErrors: { accessEvents: [], outbox: [] },
                    components: [],
                    deviceService: null
                }),
                listSnapshots: async () => []
            },
            alerts: createStubAlertsHandlers(),
            auditLogs: createStubAuditLogsHandlers()
        });
    });

    it("sets secure auth cookies on login", async () => {
        const res = await app.request("/api/auth/login", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                origin: "http://localhost:5000"
            },
            body: JSON.stringify({ email: "admin@example.com", password: "password123" })
        });

        expect(res.status).toBe(200);
        const setCookieRaw = getSetCookieHeader(res);
        expect(setCookieRaw).toContain("sg_admin_access=");
        expect(setCookieRaw).toContain("sg_admin_refresh=");
        expect(setCookieRaw).toContain("HttpOnly");
        expect(setCookieRaw).toContain("Secure");
        expect(setCookieRaw).toContain("SameSite=Lax");
        expect(setCookieRaw).toContain("Path=/");
        expect(setCookieRaw).toContain("Max-Age=");
    });

    it("requests telegram login code by email", async () => {
        const res = await app.request("/api/auth/telegram/login-code", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({ email: "admin@example.com" })
        });

        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.sent).toBe(true);
    });

    it("sets secure auth cookies on telegram otp login", async () => {
        const res = await app.request("/api/auth/telegram/login", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({ email: "admin@example.com", code: "123456" })
        });

        expect(res.status).toBe(200);
        const setCookieRaw = getSetCookieHeader(res);
        expect(setCookieRaw).toContain("sg_admin_access=");
        expect(setCookieRaw).toContain("sg_admin_refresh=");
        expect(setCookieRaw).toContain("HttpOnly");
    });

    it("supports cookie auth for /session and prioritizes bearer over cookie", async () => {
        const token = await makeToken({ adminId: "admin-1" });

        const byCookie = await app.request("/api/auth/session", {
            method: "GET",
            headers: {
                cookie: `sg_admin_access=${token}; sg_admin_refresh=refresh-login-1`
            }
        });
        expect(byCookie.status).toBe(200);

        const byBearer = await app.request("/api/auth/session", {
            method: "GET",
            headers: {
                authorization: `Bearer ${token}`,
                cookie: "sg_admin_access=invalid-token"
            }
        });
        expect(byBearer.status).toBe(200);
    });

    it("falls back to cookie when bearer token is invalid", async () => {
        const token = await makeToken({ adminId: "admin-1" });
        const res = await app.request("/api/auth/session", {
            method: "GET",
            headers: {
                authorization: "Bearer invalid-token",
                cookie: `sg_admin_access=${token}; sg_admin_refresh=refresh-login-1`
            }
        });
        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.admin.id).toBe("admin-1");
    });

    it("refreshes using refresh cookie when body token is missing", async () => {
        const res = await app.request("/api/auth/refresh", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                cookie: "sg_admin_refresh=refresh-cookie-token"
            },
            body: JSON.stringify({})
        });

        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.refreshToken).toBe("refresh-cookie-token-rotated");
    });

    it("refreshes using refresh cookie when request body is empty", async () => {
        const res = await app.request("/api/auth/refresh", {
            method: "POST",
            headers: {
                cookie: "sg_admin_refresh=refresh-cookie-empty-body"
            }
        });

        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.refreshToken).toBe("refresh-cookie-empty-body-rotated");
    });

    it("updates current admin profile", async () => {
        const token = await makeToken({ adminId: "admin-1" });
        const res = await app.request("/api/auth/me", {
            method: "PATCH",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                email: "new-admin@example.com",
                name: "New Admin"
            })
        });

        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.admin.id).toBe("admin-1");
        expect(json.data.admin.email).toBe("new-admin@example.com");
        expect(json.data.admin.roleId).toBe(roleId);
        expect(json.data.admin.name).toBe("New Admin");
    });

    it("updates current admin profile via /api/me alias", async () => {
        const token = await makeToken({ adminId: "admin-1" });
        const res = await app.request("/api/me", {
            method: "PATCH",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                email: "alias-admin@example.com",
                name: "Alias Admin"
            })
        });

        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.admin.id).toBe("admin-1");
        expect(json.data.admin.email).toBe("alias-admin@example.com");
        expect(json.data.admin.name).toBe("Alias Admin");
    });

    it("returns validation_error on invalid profile payload", async () => {
        const token = await makeToken({ adminId: "admin-1" });
        const res = await app.request("/api/auth/me", {
            method: "PATCH",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                email: "not-an-email",
                name: ""
            })
        });

        expect(res.status).toBe(400);
        const json = (await res.json()) as any;
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("validation_error");
    });

    it("changes current admin password", async () => {
        const token = await makeToken({ adminId: "admin-1" });
        const res = await app.request("/api/auth/me/password", {
            method: "PATCH",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                currentPassword: "old-password-123",
                newPassword: "new-password-123"
            })
        });

        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.adminId).toBe("admin-1");
    });

    it("changes current admin password via /api/me/password alias", async () => {
        const token = await makeToken({ adminId: "admin-1" });
        const res = await app.request("/api/me/password", {
            method: "PATCH",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                currentPassword: "old-password-123",
                newPassword: "new-password-123"
            })
        });

        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.adminId).toBe("admin-1");
    });

    it("logout revokes refresh token from cookie and clears auth cookies", async () => {
        const res = await app.request("/api/auth/logout", {
            method: "POST",
            headers: {
                cookie: "sg_admin_access=access-token; sg_admin_refresh=refresh-to-revoke"
            }
        });

        expect(res.status).toBe(200);
        expect(logoutTokens).toContain("refresh-to-revoke");
        const setCookieRaw = getSetCookieHeader(res);
        expect(setCookieRaw).toContain("sg_admin_access=");
        expect(setCookieRaw).toContain("sg_admin_refresh=");
        expect(setCookieRaw).toContain("Max-Age=0");
    });
});

