import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
    admins as adminsTable,
    passwordResets as passwordResetsTable,
    rolePermissions as rolePermissionsTable,
    roles as rolesTable
} from "@school-gate/db/schema";
import { createAdminsRepo } from "@school-gate/infra/drizzle/repos/admins.repo";
import { createPasswordResetsRepo } from "@school-gate/infra/drizzle/repos/passwordResets.repo";
import { createRolesRepo } from "@school-gate/infra/drizzle/repos/roles.repo";
import { createRuntimeSettingsService } from "@school-gate/infra";
import { createLogger } from "@school-gate/infra/logging/logger";
import { createTokenHasher } from "@school-gate/infra/security/tokenHasher";
import { createAdminsService } from "@school-gate/core/iam/services/admins.service";
import { createPasswordResetsService } from "@school-gate/core/iam/services/passwordResets.service";
import { createRolesService } from "@school-gate/core/iam/services/roles.service";
import { createCreateAdminPasswordResetLinkFlow } from "@school-gate/core/iam/flows/auth/createAdminPasswordResetLink.flow";
import { createSetAdminRoleFlow } from "@school-gate/core/iam/flows/admin/setAdminRole.flow";
import { createTestDb } from "../helpers/testDb.js";
import { createApiApp } from "../../../apps/api/src/app.js";
import {
    createAllowAllAdminAuth,
    createStubAdminAuthHandlers,
    createStubAlertsHandlers,
    createStubAuditLogsHandlers,
    createStubSubscriptionsHandlers
} from "../helpers/adminAuth.js";
import { createEmptyPersonsModule } from "../helpers/personsModule.js";

describe("API admins routes", () => {
    let cleanup: () => void;
    let db: ReturnType<typeof createTestDb>["db"];
    let app: ReturnType<typeof createApiApp>;

    beforeAll(() => {
        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;

        const adminsRepo = createAdminsRepo(db);
        const rolesRepo = createRolesRepo(db);
        const passwordResetsRepo = createPasswordResetsRepo(db);
        const tokenHasher = createTokenHasher();
        const clock = { now: () => new Date("2026-01-01T00:00:00.000Z") };
        const idGen = { nextId: () => "token-1" };

        const adminsService = createAdminsService({ adminsRepo });
        const rolesService = createRolesService({ rolesRepo, clock });
        const passwordResetsService = createPasswordResetsService({ passwordResetsRepo });

        const listAdmins = adminsService.list;
        const setAdminStatus = adminsService.setStatus;
        const setAdminRole = createSetAdminRoleFlow({ adminsService, rolesService, clock });
        const createPasswordReset = createCreateAdminPasswordResetLinkFlow({
            adminsService,
            passwordResetsService,
            tokenHasher,
            idGen,
            clock
        });

        const runtimeSettings = createRuntimeSettingsService(db);
        const logger = createLogger({ name: "api-test", level: "silent" });

        app = createApiApp({
            logger,
            adminAuth: createAllowAllAdminAuth(),
            adminAuthModule: createStubAdminAuthHandlers(),
            admins: {
                list: (input) => listAdmins(input),
                setStatus: (input) => setAdminStatus(input),
                setRole: (input) => setAdminRole(input),
                createPasswordReset: (input) => createPasswordReset(input)
            },
            runtimeSettings,
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
            alerts: createStubAlertsHandlers(),
            subscriptions: createStubSubscriptionsHandlers(),
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

    afterAll(() => cleanup());

    beforeEach(async () => {
        await db.delete(passwordResetsTable);
        await db.delete(adminsTable);
        await db.delete(rolePermissionsTable);
        await db.delete(rolesTable);

        const now = new Date("2026-01-01T00:00:00.000Z");
        await db.insert(rolesTable).values({
            id: "role-1",
            name: "manager",
            createdAt: now,
            updatedAt: now
        });

        await db.insert(adminsTable).values({
            id: "admin-1",
            email: "admin@example.com",
            passwordHash: "hash",
            roleId: "role-1",
            status: "active",
            name: "Admin",
            tgUserId: null,
            createdAt: now,
            updatedAt: now
        });

        await db.insert(rolesTable).values({
            id: "role-2",
            name: "viewer",
            createdAt: now,
            updatedAt: now
        });
    });

    it("GET /admin/admins returns admins list", async () => {
        const res = await app.request("/api/admins");
        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.admins).toHaveLength(1);
        expect(json.data.admins[0]).toMatchObject({
            id: "admin-1",
            email: "admin@example.com",
            roleId: "role-1",
            status: "active"
        });
    });

    it("PATCH /admin/admins/:id/status updates status", async () => {
        const res = await app.request("/api/admins/admin-1/status", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ status: "disabled" })
        });
        expect(res.status).toBe(200);

        const listRes = await app.request("/api/admins");
        const listJson = (await listRes.json()) as any;
        expect(listJson.data.admins[0].status).toBe("disabled");
    });

    it("PATCH /admin/admins/:id/role updates role", async () => {
        const res = await app.request("/api/admins/admin-1/role", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ roleId: "role-2" })
        });
        expect(res.status).toBe(200);

        const listRes = await app.request("/api/admins");
        const listJson = (await listRes.json()) as any;
        expect(listJson.data.admins[0].roleId).toBe("role-2");
    });

    it("POST /admin/admins/:id/password-reset creates reset token", async () => {
        const res = await app.request("/api/admins/admin-1/password-reset", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ expiresInMs: 60_000 })
        });
        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(typeof json.data.token).toBe("string");

        const rows = await db.select().from(passwordResetsTable);
        expect(rows).toHaveLength(1);
    });
});



