import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createRuntimeSettingsService } from "@school-gate/infra";
import {
    admins as adminsTable,
    adminInvites as adminInvitesTable,
    adminTgCodes as adminTgCodesTable,
    passwordResets as passwordResetsTable,
    rolePermissions as rolePermissionsTable,
    roles as rolesTable,
} from "@school-gate/db/schema";
import { createAdminsRepo } from "@school-gate/infra/drizzle/repos/admins.repo";
import { createAdminInvitesRepo } from "@school-gate/infra/drizzle/repos/adminInvites.repo";
import { createAdminTgCodesRepo } from "@school-gate/infra/drizzle/repos/adminTgCodes.repo";
import { createPasswordResetsRepo } from "@school-gate/infra/drizzle/repos/passwordResets.repo";
import { createRolesRepo } from "@school-gate/infra/drizzle/repos/roles.repo";
import { createLogger } from "@school-gate/infra/logging/logger";
import { createArgon2PasswordHasher } from "@school-gate/infra/security/passwordHasher";
import { createTokenHasher } from "@school-gate/infra/security/tokenHasher";
import { createAdminsService } from "@school-gate/core/iam/services/admins.service";
import { createAdminInvitesService } from "@school-gate/core/iam/services/adminInvites.service";
import { createAdminTgCodesService } from "@school-gate/core/iam/services/adminTgCodes.service";
import { createPasswordResetsService } from "@school-gate/core/iam/services/passwordResets.service";
import { createRolesService } from "@school-gate/core/iam/services/roles.service";
import { createAcceptAdminInviteFlow } from "@school-gate/core/iam/flows/admin/acceptAdminInvite.flow";
import { createConfirmPasswordResetFlow } from "@school-gate/core/iam/flows/password-reset/confirmPasswordReset.flow";
import { createCreateAdminInviteFlow } from "@school-gate/core/iam/flows/admin/createAdminInvite.flow";
import { createGetAdminAccessFlow } from "@school-gate/core/iam/flows/access/getAdminAccess.flow";
import { createRequestPasswordResetFlow } from "@school-gate/core/iam/flows/password-reset/requestPasswordReset.flow";
import { createCreateTelegramLinkCodeFlow } from "@school-gate/core/iam/flows/telegram/createTelegramLinkCode.flow";
import { createLinkTelegramByCodeFlow } from "@school-gate/core/iam/flows/telegram/linkTelegramByCode.flow";
import type { Permission } from "@school-gate/core/iam/constants/permissions";
import { RoleNameAlreadyExistsError } from "@school-gate/core/utils/errors";
import {
    createStubAdminsHandlers,
    createStubAlertsHandlers,
    createStubAuditLogsHandlers,
    createStubSubscriptionsHandlers,
} from "../helpers/adminAuth.js";
import { createTestDb } from "../helpers/testDb.js";
import { createApiApp } from "../../../apps/api/src/app.js";
import { createAdminAuth } from "../../../apps/api/src/delivery/http/middleware/adminAuth.js";
import { signAdminJwt } from "../../../apps/api/src/delivery/http/adminJwt.js";
import { HttpError } from "../../../apps/api/src/delivery/http/errors/httpError.js";

describe("API admin auth routes", () => {
    let cleanup: () => void;
    let db: ReturnType<typeof createTestDb>["db"];
    let app: ReturnType<typeof createApiApp>;
    let adminsRepo: ReturnType<typeof createAdminsRepo>;
    let rolesRepo: ReturnType<typeof createRolesRepo>;

    const jwtSecret = "test-admin-jwt-secret-32-chars-min!";
    const jwtTtlMs = 10 * 60_000;
    const clock = { now: () => new Date("2026-01-01T00:00:00.000Z") };

    const idGen = (() => {
        let i = 1;
        return { nextId: () => `id-${i++}` };
    })();

    beforeAll(() => {
        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;

        adminsRepo = createAdminsRepo(db);
        rolesRepo = createRolesRepo(db);
        const adminInvitesRepo = createAdminInvitesRepo(db);
        const passwordResetsRepo = createPasswordResetsRepo(db);
        const adminTgCodesRepo = createAdminTgCodesRepo(db);

        const passwordHasher = createArgon2PasswordHasher();
        const tokenHasher = createTokenHasher();
        const outbox = { enqueue: () => {} };

        const adminsService = createAdminsService({ adminsRepo, passwordHasher });
        const rolesService = createRolesService({ rolesRepo, clock });
        const adminInvitesService = createAdminInvitesService({ adminInvitesRepo });
        const passwordResetsService = createPasswordResetsService({ passwordResetsRepo });
        const adminTgCodesService = createAdminTgCodesService({ adminTgCodesRepo });

        const createRole = rolesService.createRole;
        const updateRolePermissions = rolesService.updateRolePermissions;
        const listRoles = rolesService.listRoles;
        const listRolePermissions = rolesService.listRolePermissions;
        const listPermissions = rolesService.listPermissions;
        const createAdminInvite = createCreateAdminInviteFlow({
            rolesService,
            adminInvitesService,
            outbox,
            tokenHasher,
            idGen,
            clock,
        });
        const acceptAdminInvite = createAcceptAdminInviteFlow({
            adminInvitesService,
            adminsService,
            rolesService,
            outbox,
            passwordHasher,
            tokenHasher,
            idGen,
            clock,
        });
        const requestPasswordReset = createRequestPasswordResetFlow({
            adminsService,
            passwordResetsService,
            outbox,
            tokenHasher,
            idGen,
            clock,
        });
        const confirmPasswordReset = createConfirmPasswordResetFlow({
            adminsService,
            passwordResetsService,
            passwordHasher,
            outbox,
            tokenHasher,
            idGen,
            clock,
        });
        const createTelegramLinkCode = createCreateTelegramLinkCodeFlow({
            adminsService,
            adminTgCodesService,
            outbox,
            tokenHasher,
            idGen,
            clock,
        });
        const linkTelegramByCode = createLinkTelegramByCodeFlow({
            adminsService,
            adminTgCodesService,
            outbox,
            tokenHasher,
            idGen,
            clock,
        });
        const getAdminAccess = createGetAdminAccessFlow({ adminsService, rolesService });
        const adminAuth = createAdminAuth({
            jwtSecret,
            getAdminAccess,
            cookies: {
                accessCookieName: "sg_admin_access",
                refreshCookieName: "sg_admin_refresh",
                path: "/",
                secure: false,
                sameSite: "lax",
            },
        });

        const runtimeSettings = createRuntimeSettingsService(db);
        const logger = createLogger({ name: "api-test", level: "silent" });

        const ensureRoleNameAvailable = async (name: string) => {
            const existing = await rolesRepo.getByName(name);
            if (existing) {
                throw new RoleNameAlreadyExistsError();
            }
        };

        app = createApiApp({
            logger,
            adminAuth,
            adminAuthModule: {
                login: async (input) => {
                    const result = await adminsService.login(input);
                    if (!result) {
                        throw new HttpError({
                            status: 401,
                            code: "invalid_credentials",
                            message: "Invalid credentials",
                        });
                    }
                    const access = await getAdminAccess(result.admin.id);
                    const token = await signAdminJwt({
                        secret: jwtSecret,
                        ttlMs: jwtTtlMs,
                        payload: {
                            adminId: access.adminId,
                            roleId: access.roleId,
                            permissions: access.permissions,
                        },
                    });
                    return {
                        token,
                        expiresAt: new Date(clock.now().getTime() + jwtTtlMs).toISOString(),
                        refreshToken: `refresh-${idGen.nextId()}`,
                        refreshExpiresAt: new Date(clock.now().getTime() + jwtTtlMs).toISOString(),
                        admin: {
                            id: result.admin.id,
                            email: result.admin.email,
                            roleId: result.admin.roleId,
                            status: result.admin.status,
                            name: result.admin.name,
                            tgUserId: result.admin.tgUserId,
                        },
                    };
                },
                requestTelegramLoginCode: async () => ({
                    sent: true,
                    expiresAt: new Date(clock.now().getTime() + 5 * 60_000).toISOString()
                }),
                loginWithTelegramCode: async () => {
                    const token = await signAdminJwt({
                        secret: jwtSecret,
                        ttlMs: jwtTtlMs,
                        payload: {
                            adminId: "admin-1",
                            roleId: "role-admin",
                            permissions: ["admin.manage"]
                        }
                    });
                    return {
                        token,
                        expiresAt: new Date(clock.now().getTime() + jwtTtlMs).toISOString(),
                        refreshToken: `refresh-${idGen.nextId()}`,
                        refreshExpiresAt: new Date(clock.now().getTime() + jwtTtlMs).toISOString(),
                        admin: {
                            id: "admin-1",
                            email: "admin@example.com",
                            roleId: "role-admin",
                            status: "active",
                            name: "Admin",
                            tgUserId: "1001"
                        }
                    };
                },
                updateMyProfile: async (input) => ({
                    admin: {
                        id: input.adminId,
                        email: input.email,
                        roleId: "role-1",
                        status: "active",
                        name: input.name ?? null,
                        tgUserId: null,
                    },
                }),
                changeMyPassword: async (input) => {
                    const admin = await adminsService.getById(input.adminId);
                    if (!admin) {
                        throw new Error("admin_not_found");
                    }
                    const current = await adminsService.login({
                        email: admin.email,
                        password: input.currentPassword
                    });
                    if (!current) {
                        throw new Error("current_password_invalid");
                    }
                    const passwordHash = await passwordHasher.hash(input.newPassword);
                    await adminsService.setPassword({
                        adminId: input.adminId,
                        passwordHash,
                        updatedAt: clock.now(),
                        actorId: input.adminId
                    });
                    return { adminId: input.adminId };
                },
                createInvite: async (input) => {
                    const expiresAt = new Date(clock.now().getTime() + input.expiresInMs);
                    if (input.roleName) {
                        await ensureRoleNameAvailable(input.roleName);
                        const roleId = idGen.nextId();
                        await createRole({
                            id: roleId,
                            name: input.roleName,
                            permissions: (input.permissions ?? []) as Permission[],
                        });
                        const result = await createAdminInvite({
                            roleId,
                            email: input.email,
                            createdBy: input.adminId,
                            expiresAt,
                        });
                        return {
                            ...result,
                            expiresAt: result.expiresAt.toISOString(),
                        };
                    }
                    if (!input.roleId) {
                        throw new Error("roleId_missing");
                    }
                    const result = await createAdminInvite({
                        roleId: input.roleId,
                        email: input.email,
                        createdBy: input.adminId,
                        expiresAt,
                    });
                    return {
                        ...result,
                        expiresAt: result.expiresAt.toISOString(),
                    };
                },
                acceptInvite: (input) => acceptAdminInvite(input),
                requestPasswordReset: (input) =>
                    requestPasswordReset({
                        email: input.email,
                        expiresAt: new Date(clock.now().getTime() + input.expiresInMs),
                    }),
                confirmPasswordReset: (input) => confirmPasswordReset(input),
                createTelegramLinkCode: (input) =>
                    createTelegramLinkCode({
                        adminId: input.adminId,
                        expiresAt: new Date(clock.now().getTime() + input.expiresInMs),
                    }).then((result) => ({
                        ...result,
                        expiresAt: result.expiresAt.toISOString(),
                    })),
                linkTelegramByCode: (input) => linkTelegramByCode(input),
                unlinkTelegram: async (input) => {
                    await adminsService.setTgUserId({
                        adminId: input.adminId,
                        tgUserId: null,
                        updatedAt: clock.now(),
                        actorId: input.adminId
                    });
                    return { adminId: input.adminId };
                },
                createRole: async (input) => {
                    await ensureRoleNameAvailable(input.name);
                    const roleId = idGen.nextId();
                    await createRole({
                        id: roleId,
                        name: input.name,
                        permissions: input.permissions as Permission[],
                    });
                    return { roleId };
                },
                updateRolePermissions: (input) =>
                    updateRolePermissions({
                        roleId: input.roleId,
                        permissions: input.permissions as Permission[],
                    }).then(() => ({ roleId: input.roleId })),
                listRoles: async () => {
                    const roles = await listRoles();
                    return {
                        roles: roles.map((role) => ({
                            id: role.id,
                            name: role.name,
                            createdAt: role.createdAt.toISOString(),
                            updatedAt: role.updatedAt.toISOString(),
                        })),
                    };
                },
                listRolePermissions: (roleId) =>
                    listRolePermissions(roleId).then((permissions) => ({
                        roleId,
                        permissions,
                    })),
                listPermissions: () => ({ permissions: listPermissions() }),
            },
            admins: createStubAdminsHandlers(),
            runtimeSettings,
            accessEvents: {
                verifyIngestAuth: async (_c, next) => next(),
                module: {
                    ingest: async () => ({
                        result: "duplicate",
                        status: "NEW",
                        personId: null,
                        accessEventId: null,
                    }),
                },
            },
            accessEventsAdmin: {
                listUnmatched: async () => [],
                mapTerminalIdentity: async () => ({ status: "already_linked", updatedEvents: 0 }),
            },
            persons: {
                searchByIin: async () => [],
            },
            subscriptionRequests: {
                listPending: async () => ({ requests: [], page: { limit: 50, offset: 0, total: 0 } }),
                review: async () => ({ requestId: "r1", status: "rejected", personId: null }),
            },
            alerts: createStubAlertsHandlers(),
            subscriptions: createStubSubscriptionsHandlers(),
            auditLogs: createStubAuditLogsHandlers(),
            retention: {
                applySchedule: async () => ({
                    taskName: "school-gate-retention",
                    platform: process.platform,
                    pollMs: 300000,
                    intervalMinutes: 5,
                }),
                removeSchedule: async () => ({
                    taskName: "school-gate-retention",
                    platform: process.platform,
                    removed: true,
                }),
                runOnce: async () => ({
                    accessEventsDeleted: 0,
                    auditLogsDeleted: 0,
                    accessEventsCutoff: new Date("2026-01-01T00:00:00.000Z"),
                    auditLogsCutoff: new Date("2026-01-01T00:00:00.000Z"),
                    batch: 500,
                    accessEventsDays: 30,
                    auditLogsDays: 30,
                }),
            },
            monitoring: {
                getSnapshot: async () => ({
                    now: new Date("2026-01-01T00:00:00.000Z"),
                    accessEvents: {
                        counts: {
                            NEW: 0,
                            PROCESSING: 0,
                            PROCESSED: 0,
                            FAILED_RETRY: 0,
                            UNMATCHED: 0,
                            ERROR: 0,
                        },
                        oldestUnprocessedOccurredAt: null,
                    },
                    outbox: {
                        counts: { new: 0, processing: 0, processed: 0, error: 0 },
                        oldestNewCreatedAt: null,
                    },
                    workers: [],
                    topErrors: { accessEvents: [], outbox: [] },
                    components: [],
                    deviceService: null,
                }),
                listSnapshots: async () => [],
            },
        });
    });

    afterAll(() => {
        cleanup();
    });

    beforeEach(async () => {
        await db.delete(adminTgCodesTable);
        await db.delete(passwordResetsTable);
        await db.delete(adminInvitesTable);
        await db.delete(adminsTable);
        await db.delete(rolePermissionsTable);
        await db.delete(rolesTable);

        const now = clock.now();
        await rolesRepo.upsert({
            id: "role-admin",
            name: "super-admin",
            createdAt: now,
            updatedAt: now,
        });
        await rolesRepo.replacePermissions({
            roleId: "role-admin",
            permissions: ["admin.manage"] as Permission[],
        });

        const passwordHasher = createArgon2PasswordHasher();
        const passwordHash = await passwordHasher.hash("password123");
        await adminsRepo.create({
            id: "admin-1",
            email: "admin@example.com",
            passwordHash,
            roleId: "role-admin",
            status: "active",
            name: "Admin",
            tgUserId: null,
            createdAt: now,
            updatedAt: now,
        });
    });

    it("POST /api/auth/login returns token", async () => {
        const res = await app.request("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
        });

        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(typeof json.data.token).toBe("string");
        expect(json.data.admin.email).toBe("admin@example.com");
    });

    it("rejects protected routes without auth", async () => {
        const res = await app.request("/api/auth/invites", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                roleId: "role-admin",
                expiresInMs: 60_000,
            }),
        });

        expect(res.status).toBe(401);
        const json = (await res.json()) as any;
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("unauthorized");
    });

    it("creates invite with roleName and accepts it", async () => {
        const loginRes = await app.request("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
        });
        const loginJson = (await loginRes.json()) as any;
        const token = loginJson.data.token as string;

        const inviteRes = await app.request("/api/auth/invites", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                roleName: "device-manager",
                permissions: ["devices.read", "devices.write"],
                email: "new@example.com",
                expiresInMs: 60_000,
            }),
        });
        expect(inviteRes.status).toBe(200);
        const inviteJson = (await inviteRes.json()) as any;
        expect(inviteJson.success).toBe(true);
        const inviteToken = inviteJson.data.token as string;

        const acceptRes = await app.request("/api/auth/invites/accept", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                token: inviteToken,
                email: "new@example.com",
                password: "newpass123",
                name: "New Admin",
            }),
        });
        expect(acceptRes.status).toBe(200);
        const acceptJson = (await acceptRes.json()) as any;
        expect(acceptJson.success).toBe(true);
        expect(acceptJson.data.adminId).toBeDefined();
    });

    it("rejects duplicate role name on invite", async () => {
        const loginRes = await app.request("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
        });
        const loginJson = (await loginRes.json()) as any;
        const token = loginJson.data.token as string;

        const res = await app.request("/api/auth/invites", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                roleName: "super-admin",
                permissions: ["admin.manage"],
                expiresInMs: 60_000,
            }),
        });

        expect(res.status).toBe(409);
        const json = (await res.json()) as any;
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("role_name_exists");
    });

    it("handles password reset request and confirm", async () => {
        const requestRes = await app.request("/api/auth/password-resets/request", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: "admin@example.com", expiresInMs: 60_000 }),
        });
        const requestJson = (await requestRes.json()) as any;
        expect(requestJson.success).toBe(true);
        const token = requestJson.data.token as string;

        const confirmRes = await app.request("/api/auth/password-resets/confirm", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ token, password: "new-password-123" }),
        });
        expect(confirmRes.status).toBe(200);
        const confirmJson = (await confirmRes.json()) as any;
        expect(confirmJson.success).toBe(true);

        const loginRes = await app.request("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: "admin@example.com", password: "new-password-123" }),
        });
        expect(loginRes.status).toBe(200);
    });

    it("changes own password with current password check", async () => {
        const loginRes = await app.request("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
        });
        const loginJson = (await loginRes.json()) as any;
        const token = loginJson.data.token as string;

        const changeRes = await app.request("/api/auth/me/password", {
            method: "PATCH",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                currentPassword: "password123",
                newPassword: "new-password-777",
            }),
        });
        expect(changeRes.status).toBe(200);
        const changeJson = (await changeRes.json()) as any;
        expect(changeJson.success).toBe(true);
        expect(changeJson.data.adminId).toBe("admin-1");

        const oldLoginRes = await app.request("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
        });
        expect(oldLoginRes.status).toBe(401);

        const newLoginRes = await app.request("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: "admin@example.com", password: "new-password-777" }),
        });
        expect(newLoginRes.status).toBe(200);
    });

    it("creates telegram link code and links admin", async () => {
        const loginRes = await app.request("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
        });
        const loginJson = (await loginRes.json()) as any;
        const token = loginJson.data.token as string;

        const codeRes = await app.request("/api/auth/telegram/link-code", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ expiresInMs: 60_000 }),
        });
        const codeJson = (await codeRes.json()) as any;
        expect(codeJson.success).toBe(true);
        const code = codeJson.data.code as string;

        const linkRes = await app.request("/api/auth/telegram/link-by-code", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ code, tgUserId: "tg-1" }),
        });
        expect(linkRes.status).toBe(200);
        const linkJson = (await linkRes.json()) as any;
        expect(linkJson.success).toBe(true);
        expect(linkJson.data.adminId).toBe("admin-1");
    });

    it("unlinks telegram from current admin", async () => {
        const loginRes = await app.request("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
        });
        const loginJson = (await loginRes.json()) as any;
        const token = loginJson.data.token as string;

        const codeRes = await app.request("/api/auth/telegram/link-code", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ expiresInMs: 60_000 }),
        });
        const codeJson = (await codeRes.json()) as any;
        const code = codeJson.data.code as string;

        await app.request("/api/auth/telegram/link-by-code", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ code, tgUserId: "tg-1" }),
        });

        const unlinkRes = await app.request("/api/auth/telegram/unlink", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${token}`
            },
            body: JSON.stringify({})
        });
        expect(unlinkRes.status).toBe(200);
        const unlinkJson = (await unlinkRes.json()) as any;
        expect(unlinkJson.success).toBe(true);
        expect(unlinkJson.data.adminId).toBe("admin-1");

        const updatedAdmin = await adminsRepo.getById("admin-1");
        expect(updatedAdmin?.tgUserId).toBeNull();
    });

    it("creates role and updates permissions", async () => {
        const loginRes = await app.request("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
        });
        const loginJson = (await loginRes.json()) as any;
        const token = loginJson.data.token as string;

        const createRes = await app.request("/api/auth/roles", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                name: "viewer",
                permissions: ["monitoring.read"],
            }),
        });
        expect(createRes.status).toBe(200);
        const createJson = (await createRes.json()) as any;
        const roleId = createJson.data.roleId as string;

        const updateRes = await app.request(`/api/auth/roles/${roleId}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ permissions: ["monitoring.read", "settings.read"] }),
        });
        expect(updateRes.status).toBe(200);
    });

    it("lists roles and role permissions", async () => {
        const loginRes = await app.request("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
        });
        const loginJson = (await loginRes.json()) as any;
        const token = loginJson.data.token as string;

        const rolesRes = await app.request("/api/auth/roles", {
            method: "GET",
            headers: { authorization: `Bearer ${token}` },
        });
        expect(rolesRes.status).toBe(200);
        const rolesJson = (await rolesRes.json()) as any;
        const role = rolesJson.data.roles.find((item: any) => item.id === "role-admin");
        expect(role).toBeTruthy();

        const permsRes = await app.request("/api/auth/roles/role-admin/permissions", {
            method: "GET",
            headers: { authorization: `Bearer ${token}` },
        });
        expect(permsRes.status).toBe(200);
        const permsJson = (await permsRes.json()) as any;
        expect(permsJson.data.permissions).toContain("admin.manage");
    });

    it("lists permissions", async () => {
        const loginRes = await app.request("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
        });
        const loginJson = (await loginRes.json()) as any;
        const token = loginJson.data.token as string;

        const res = await app.request("/api/auth/permissions", {
            method: "GET",
            headers: { authorization: `Bearer ${token}` },
        });
        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.data.permissions).toContain("admin.manage");
    });
});



