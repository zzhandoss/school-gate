import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { settings as settingsTable } from "@school-gate/db/schema";
import { runtimeSettingKeys } from "@school-gate/core/config/runtimeConfig";
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
import { createTestDb } from "../helpers/testDb.js";
import { createApiApp } from "../../../apps/api/src/app.js";

describe("API runtime settings routes", () => {
    let cleanup: () => void;
    let app: ReturnType<typeof createApiApp>;
    let db: ReturnType<typeof createTestDb>["db"];

    const prevEnv = {
        WORKER_POLL_MS: process.env.WORKER_POLL_MS,
        WORKER_BATCH: process.env.WORKER_BATCH,
        FEATURE_AUTO_RESOLVE_PERSON: process.env.FEATURE_AUTO_RESOLVE_PERSON,
        OUTBOX_BATCH: process.env.OUTBOX_BATCH,
        ACCESS_EVENTS_LEASE_MS: process.env.ACCESS_EVENTS_LEASE_MS,
        RETENTION_POLL_MS: process.env.RETENTION_POLL_MS,
        RETENTION_BATCH: process.env.RETENTION_BATCH,
        RETENTION_ACCESS_EVENTS_DAYS: process.env.RETENTION_ACCESS_EVENTS_DAYS,
        RETENTION_AUDIT_LOGS_DAYS: process.env.RETENTION_AUDIT_LOGS_DAYS,
        MONITORING_WORKER_TTL_MS: process.env.MONITORING_WORKER_TTL_MS
    };

    beforeAll(() => {
        process.env.WORKER_POLL_MS = "3000";
        process.env.WORKER_BATCH = "20";
        process.env.FEATURE_AUTO_RESOLVE_PERSON = "false";
        process.env.OUTBOX_BATCH = "50";
        process.env.ACCESS_EVENTS_LEASE_MS = "60000";
        process.env.RETENTION_POLL_MS = "300000";
        process.env.RETENTION_BATCH = "500";
        process.env.RETENTION_ACCESS_EVENTS_DAYS = "30";
        process.env.RETENTION_AUDIT_LOGS_DAYS = "30";
        process.env.MONITORING_WORKER_TTL_MS = "120000";

        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;

        const runtimeSettingsService = createRuntimeSettingsService(db);
        const runtimeSettings = {
            list: () => JSON.parse(JSON.stringify(runtimeSettingsService.list())),
            set: runtimeSettingsService.set
        };
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

    afterAll(() => {
        process.env.WORKER_POLL_MS = prevEnv.WORKER_POLL_MS;
        process.env.WORKER_BATCH = prevEnv.WORKER_BATCH;
        process.env.FEATURE_AUTO_RESOLVE_PERSON = prevEnv.FEATURE_AUTO_RESOLVE_PERSON;
        process.env.OUTBOX_BATCH = prevEnv.OUTBOX_BATCH;
        process.env.ACCESS_EVENTS_LEASE_MS = prevEnv.ACCESS_EVENTS_LEASE_MS;
        process.env.RETENTION_POLL_MS = prevEnv.RETENTION_POLL_MS;
        process.env.RETENTION_BATCH = prevEnv.RETENTION_BATCH;
        process.env.RETENTION_ACCESS_EVENTS_DAYS = prevEnv.RETENTION_ACCESS_EVENTS_DAYS;
        process.env.RETENTION_AUDIT_LOGS_DAYS = prevEnv.RETENTION_AUDIT_LOGS_DAYS;
        process.env.MONITORING_WORKER_TTL_MS = prevEnv.MONITORING_WORKER_TTL_MS;
        cleanup();
    });

    beforeEach(async () => {
        await db.delete(settingsTable);
    });

    it("GET /health returns ok", async () => {
        const res = await app.request("/health");
        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toEqual({ success: true, data: { ok: true } });
    });

    it("GET /admin/runtime-settings returns a snapshot", async () => {
        const res = await app.request("/api/runtime-settings");
        expect(res.status).toBe(200);

        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.worker.pollMs.env).toBe(3000);
        expect(json.data.worker.pollMs.effective).toBe(3000);
        expect(json.data.worker.pollMs.db).toBeUndefined();
        expect(json.data.retention.accessEventsDays.env).toBe(30);
        expect(json.data.monitoring.workerTtlMs.env).toBe(120000);
    });

    it("PATCH /admin/runtime-settings validates input", async () => {
        const res = await app.request("/api/runtime-settings", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                worker: { pollMs: -1 }
            })
        });

        expect(res.status).toBe(400);
        const json = (await res.json()) as any;
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("validation_error");
        expect(Array.isArray(json.error.data?.issues)).toBe(true);
        expect(json.error.data.issues.length).toBeGreaterThan(0);
    });

    it("PATCH /admin/runtime-settings applies overrides", async () => {
        const patchRes = await app.request("/api/runtime-settings", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                worker: { pollMs: 1111 },
                outbox: { batch: 7 },
                monitoring: { workerTtlMs: 240000 }
            })
        });

        expect(patchRes.status).toBe(200);
        const patchJson = (await patchRes.json()) as any;
        expect(patchJson.success).toBe(true);
        expect(patchJson.data.updated).toBeGreaterThan(0);

        const getRes = await app.request("/api/runtime-settings");
        const getJson = (await getRes.json()) as any;
        expect(getJson.success).toBe(true);
        expect(getJson.data.worker.pollMs.db).toBe(1111);
        expect(getJson.data.worker.pollMs.effective).toBe(1111);
        expect(getJson.data.outbox.batch.db).toBe(7);
        expect(getJson.data.outbox.batch.effective).toBe(7);
        expect(getJson.data.monitoring.workerTtlMs.effective).toBe(240000);
    });

    it("invalid DB settings fail fast with 500", async () => {
        await db.insert(settingsTable).values({
            key: runtimeSettingKeys.workerPollMs,
            value: "not-a-number",
            updatedAt: new Date()
        });

        const res = await app.request("/api/runtime-settings");
        expect(res.status).toBe(500);
        const json = (await res.json()) as any;
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("internal_error");
    });
});



