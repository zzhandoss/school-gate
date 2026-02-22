import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createRuntimeSettingsService } from "@school-gate/infra";
import { createLogger } from "@school-gate/infra/logging/logger";
import type { SubscriptionAdminView } from "@school-gate/core/repos/subscriptions.repo";
import { createApiApp } from "../../../apps/api/src/app.js";
import {
    createAllowAllAdminAuth,
    createStubAdminAuthHandlers,
    createStubAlertsHandlers,
    createStubAdminsHandlers,
    createStubAuditLogsHandlers
} from "../helpers/adminAuth.js";
import { createTestDb } from "../helpers/testDb.js";

describe("API subscriptions admin routes", () => {
    let cleanup: () => void;
    let app: ReturnType<typeof createApiApp>;

    const sampleSubscription: SubscriptionAdminView = {
        id: "sub-1",
        tgUserId: "tg-1",
        personId: "person-1",
        isActive: true,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        person: {
            id: "person-1",
            iin: "123456789012",
            firstName: "Ivan",
            lastName: "Ivanov"
        },
        parent: {
            tgUserId: "tg-1",
            chatId: "chat-1"
        }
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
            persons: {
                searchByIin: async () => []
            },
            subscriptionRequests: {
                listPending: async () => ({ requests: [], page: { limit: 50, offset: 0, total: 0 } }),
                review: async () => ({ requestId: "r1", status: "rejected", personId: null })
            },
            alerts: createStubAlertsHandlers(),
            subscriptions: {
                list: async () => [sampleSubscription],
                activate: async ({ subscriptionId }) => subscriptionId !== "missing",
                deactivate: async ({ subscriptionId }) => subscriptionId !== "missing"
            },
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

    it("GET /admin/subscriptions returns list", async () => {
        const res = await app.request("/api/subscriptions");
        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.subscriptions[0].id).toBe("sub-1");
    });

    it("GET /admin/subscriptions validates query", async () => {
        const res = await app.request("/api/subscriptions?limit=-1");
        expect(res.status).toBe(400);
        const json = (await res.json()) as any;
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("invalid_query");
    });

    it("POST /admin/subscriptions/:id/activate returns 404 when missing", async () => {
        const res = await app.request("/api/subscriptions/missing/activate", { method: "POST" });
        expect(res.status).toBe(404);
        const json = (await res.json()) as any;
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("subscription_not_found");
    });

    it("POST /admin/subscriptions/:id/deactivate returns result", async () => {
        const res = await app.request("/api/subscriptions/sub-1/deactivate", { method: "POST" });
        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.isActive).toBe(false);
    });
});



