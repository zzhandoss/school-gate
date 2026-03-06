import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { admins as adminsTable, rolePermissions as rolePermissionsTable, roles as rolesTable } from "@school-gate/db/schema";
import type {
    AdminLoginDto,
    AdminLoginResultDto,
    AdminRefreshDto,
    AdminRefreshResultDto,
    BootstrapFirstAdminDto
} from "@school-gate/contracts";
import type { Permission } from "@school-gate/core";
import { createAdminsRepo } from "@school-gate/infra/drizzle/repos/admins.repo";
import { createRolesRepo } from "@school-gate/infra/drizzle/repos/roles.repo";
import { createArgon2PasswordHasher } from "@school-gate/infra/security/passwordHasher";
import { createAdminsService } from "@school-gate/core/iam/services/admins.service";
import { createRolesService } from "@school-gate/core/iam/services/roles.service";
import { createCreateFirstAdminFlow } from "@school-gate/core";
import { createLogger } from "@school-gate/infra/logging/logger";
import { createAllowAllAdminAuth, createStubAlertsHandlers, createStubAuditLogsHandlers, createStubSubscriptionsHandlers } from "../helpers/adminAuth.js";
import { createEmptyPersonsModule } from "../helpers/personsModule.js";
import { createTestDb } from "../helpers/testDb.js";
import { createApiApp } from "../../../apps/api/src/app.js";
import { signAdminJwt } from "../../../apps/api/src/delivery/http/adminJwt.js";

describe("API first admin bootstrap", () => {
    let cleanup: () => void;
    let db: ReturnType<typeof createTestDb>["db"];
    let app: ReturnType<typeof createApiApp>;
    let adminsRepo: ReturnType<typeof createAdminsRepo>;
    let rolesRepo: ReturnType<typeof createRolesRepo>;

    const clock = { now: () => new Date("2026-01-01T00:00:00.000Z") };
    const jwtSecret = "test-admin-jwt-secret-32-chars-min!";
    const jwtTtlMs = 10 * 60_000;
    const refreshTtlMs = 30 * 24 * 60 * 60 * 1000;
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

        const passwordHasher = createArgon2PasswordHasher();
        const adminsService = createAdminsService({ adminsRepo, passwordHasher });
        const rolesService = createRolesService({ rolesRepo, clock });
        const createFirstAdmin = createCreateFirstAdminFlow({
            adminsService,
            rolesService,
            passwordHasher,
            idGen,
            clock
        });

        const login = async (input: AdminLoginDto): Promise<AdminLoginResultDto> => {
            const result = await adminsService.login(input);
            if (!result) {
                throw new Error("invalid_credentials");
            }

            const permissions = await rolesService.listRolePermissions(result.admin.roleId);
            const token = await signAdminJwt({
                secret: jwtSecret,
                ttlMs: jwtTtlMs,
                payload: {
                    adminId: result.admin.id,
                    roleId: result.admin.roleId,
                    permissions
                }
            });

            return {
                token,
                expiresAt: new Date(clock.now().getTime() + jwtTtlMs).toISOString(),
                refreshToken: `refresh-${idGen.nextId()}`,
                refreshExpiresAt: new Date(clock.now().getTime() + refreshTtlMs).toISOString(),
                admin: {
                    id: result.admin.id,
                    email: result.admin.email,
                    roleId: result.admin.roleId,
                    status: result.admin.status,
                    name: result.admin.name,
                    tgUserId: result.admin.tgUserId
                }
            };
        };

        const refresh = async (_input: AdminRefreshDto): Promise<AdminRefreshResultDto> => {
            return {
                token: `token-${idGen.nextId()}`,
                expiresAt: new Date(clock.now().getTime() + jwtTtlMs).toISOString(),
                refreshToken: `refresh-${idGen.nextId()}`,
                refreshExpiresAt: new Date(clock.now().getTime() + refreshTtlMs).toISOString()
            };
        };

        app = createApiApp({
            logger: createLogger({ name: "api-first-admin-test", level: "silent" }),
            adminAuth: createAllowAllAdminAuth(),
            adminAuthModule: {
                login,
                requestTelegramLoginCode: async () => ({
                    sent: true,
                    expiresAt: new Date("2026-01-01T00:05:00.000Z").toISOString()
                }),
                loginWithTelegramCode: async () => ({
                    token: `token-${idGen.nextId()}`,
                    expiresAt: new Date(clock.now().getTime() + jwtTtlMs).toISOString(),
                    refreshToken: `refresh-${idGen.nextId()}`,
                    refreshExpiresAt: new Date(clock.now().getTime() + refreshTtlMs).toISOString(),
                    admin: {
                        id: "admin-1",
                        email: "root@example.com",
                        roleId: "role-1",
                        status: "active",
                        name: "Root Admin",
                        tgUserId: "1001"
                    }
                }),
                refresh,
                session: async () => ({
                    admin: {
                        id: "admin-1",
                        email: "root@example.com",
                        roleId: "role-1",
                        status: "active",
                        name: "Root Admin",
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
                bootstrapFirstAdmin: (input: BootstrapFirstAdminDto) => createFirstAdmin(input),
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
                    code: "code",
                    expiresAt: new Date("2026-01-01T00:00:00.000Z").toISOString()
                }),
                linkTelegramByCode: async () => ({ adminId: "admin-1" }),
                unlinkTelegram: async () => ({ adminId: "admin-1" }),
                createRole: async () => ({ roleId: "role-1" }),
                updateRolePermissions: async (input) => ({ roleId: input.roleId }),
                listRoles: async () => ({ roles: [] }),
                listRolePermissions: async (roleId) => ({ roleId, permissions: [] }),
                listPermissions: async () => ({ permissions: [] })
            },
            admins: {
                list: async () => ({ admins: [] }),
                setStatus: async () => {},
                setRole: async () => {},
                createPasswordReset: async () => ({
                    token: "reset-token",
                    expiresAt: new Date("2026-01-01T00:00:00.000Z").toISOString()
                })
            },
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
                review: async () => ({ requestId: "r1", status: "rejected", personId: null })
            },
            subscriptions: createStubSubscriptionsHandlers(),
            alerts: createStubAlertsHandlers(),
            auditLogs: createStubAuditLogsHandlers(),
            retention: {
                applySchedule: async () => ({
                    taskName: "school-gate-retention",
                    platform: process.platform,
                    pollMs: 300000,
                    intervalMinutes: 5
                }),
                removeSchedule: async () => ({
                    taskName: "school-gate-retention",
                    platform: process.platform,
                    removed: true
                }),
                runOnce: async () => ({
                    accessEventsDeleted: 0,
                    auditLogsDeleted: 0,
                    accessEventsCutoff: new Date("2026-01-01T00:00:00.000Z"),
                    auditLogsCutoff: new Date("2026-01-01T00:00:00.000Z"),
                    batch: 500,
                    accessEventsDays: 30,
                    auditLogsDays: 30
                })
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
                            ERROR: 0
                        },
                        oldestUnprocessedOccurredAt: null
                    },
                    outbox: {
                        counts: { new: 0, processing: 0, processed: 0, error: 0 },
                        oldestNewCreatedAt: null
                    },
                    workers: [],
                    topErrors: { accessEvents: [], outbox: [] },
                    components: [],
                    deviceService: null
                }),
                listSnapshots: async () => []
            }
        });
    });

    afterAll(() => {
        cleanup();
    });

    beforeEach(async () => {
        await db.delete(adminsTable);
        await db.delete(rolePermissionsTable);
        await db.delete(rolesTable);
    });

    it("creates first admin and allows login", async () => {
        const bootstrapRes = await app.request("/api/auth/bootstrap/first-admin", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                email: "root@example.com",
                password: "password123",
                name: "Root Admin"
            })
        });

        expect(bootstrapRes.status).toBe(200);
        const bootstrapJson = (await bootstrapRes.json()) as any;
        expect(bootstrapJson.success).toBe(true);
        expect(typeof bootstrapJson.data.adminId).toBe("string");
        expect(typeof bootstrapJson.data.roleId).toBe("string");

        const superAdminRole = await rolesRepo.getByName("super_admin");
        expect(superAdminRole).toBeTruthy();
        const permissions = await rolesRepo.listPermissions(superAdminRole!.id);
        expect(permissions).toContain("admin.manage" as Permission);
        expect(permissions.length).toBeGreaterThan(5);

        const loginRes = await app.request("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: "root@example.com", password: "password123" })
        });

        expect(loginRes.status).toBe(200);
        const loginJson = (await loginRes.json()) as any;
        expect(loginJson.success).toBe(true);
        expect(typeof loginJson.data.token).toBe("string");
        expect(loginJson.data.admin.email).toBe("root@example.com");
    });

    it("returns 409 when first admin already exists", async () => {
        const firstRes = await app.request("/api/auth/bootstrap/first-admin", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                email: "root2@example.com",
                password: "password123"
            })
        });
        expect(firstRes.status).toBe(200);

        const secondRes = await app.request("/api/auth/bootstrap/first-admin", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                email: "root3@example.com",
                password: "password123"
            })
        });

        expect(secondRes.status).toBe(409);
        const secondJson = (await secondRes.json()) as any;
        expect(secondJson.success).toBe(false);
        expect(secondJson.error.code).toBe("first_admin_already_exists");
    });
});

