import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createRuntimeSettingsService } from "@school-gate/infra";
import { createLogger } from "@school-gate/infra/logging/logger";
import {
    createAllowAllAdminAuth,
    createStubAdminAuthHandlers,
    createStubAlertsHandlers,
    createStubAdminsHandlers,
    createStubAuditLogsHandlers,
    createStubSubscriptionsHandlers
} from "../helpers/adminAuth.js";
import { createEmptyPersonsModule } from "../helpers/personsModule.js";
import { createTestDb } from "../helpers/testDb.js";
import { createApiApp } from "../../../apps/api/src/app.js";

describe("API retention schedule routes", () => {
    let cleanup: () => void;
    let app: ReturnType<typeof createApiApp>;

    beforeAll(() => {
        const tdb = createTestDb();
        cleanup = tdb.cleanup;

        const runtimeSettings = createRuntimeSettingsService(tdb.db);
        const logger = createLogger({ name: "api-test", level: "silent" });

        app = createApiApp({
            logger,
            adminAuth: createAllowAllAdminAuth(),
            adminAuthModule: createStubAdminAuthHandlers(),
            admins: createStubAdminsHandlers(),
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
                    accessEventsDeleted: 2,
                    auditLogsDeleted: 1,
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

    it("POST /admin/retention/schedule/apply returns applied schedule info", async () => {
        const res = await app.request("/api/retention/schedule/apply", {
            method: "POST"
        });

        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data).toMatchObject({
            taskName: "school-gate-retention",
            intervalMinutes: 5
        });
    });

    it("POST /admin/retention/schedule/remove returns removal info", async () => {
        const res = await app.request("/api/retention/schedule/remove", {
            method: "POST"
        });

        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data).toMatchObject({
            taskName: "school-gate-retention",
            removed: true
        });
    });

    it("POST /admin/retention/run-once returns cleanup summary", async () => {
        const res = await app.request("/api/retention/run-once", {
            method: "POST"
        });

        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data).toMatchObject({
            accessEventsDeleted: 2,
            auditLogsDeleted: 1,
            batch: 500
        });
        expect(typeof json.data.accessEventsCutoff).toBe("string");
        expect(typeof json.data.auditLogsCutoff).toBe("string");
    });
});



