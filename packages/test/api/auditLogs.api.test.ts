import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createRuntimeSettingsService } from "@school-gate/infra";
import { createLogger } from "@school-gate/infra/logging/logger";
import type { AuditLogRecord } from "@school-gate/core/audit";
import { createApiApp } from "../../../apps/api/src/app.js";
import {
    createAllowAllAdminAuth,
    createStubAdminAuthHandlers,
    createStubAlertsHandlers,
    createStubAdminsHandlers,
    createStubSubscriptionsHandlers
} from "../helpers/adminAuth.js";
import { createEmptyPersonsModule } from "../helpers/personsModule.js";
import { createTestDb } from "../helpers/testDb.js";

describe("API audit logs routes", () => {
    let cleanup: () => void;
    let app: ReturnType<typeof createApiApp>;

    const sampleLog: AuditLogRecord = {
        id: "log-1",
        eventId: "evt-1",
        actorId: "admin-1",
        action: "subscription_activated",
        entityType: "subscription",
        entityId: "sub-1",
        meta: { isActive: true },
        at: new Date("2026-01-01T00:00:00.000Z")
    };

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
            auditLogs: {
                list: async (input) => ({
                    logs: [sampleLog],
                    page: {
                        limit: input.limit,
                        offset: input.offset,
                        total: 1
                    }
                })
            },
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

    it("GET /admin/audit-logs returns list", async () => {
        const res = await app.request("/api/audit-logs");
        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.logs[0].id).toBe("log-1");
        expect(json.data.page.total).toBe(1);
    });

    it("GET /admin/audit-logs validates query", async () => {
        const res = await app.request("/api/audit-logs?limit=-1");
        expect(res.status).toBe(400);
        const json = (await res.json()) as any;
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("invalid_query");
    });
});



