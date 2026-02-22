import crypto from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { outboxEvents, persons, subscriptionRequests, subscriptions } from "@school-gate/db/schema";
import { createListPendingSubscriptionRequestsUC } from "@school-gate/core/usecases/listPendingSubscriptionRequests";
import { createReviewSubscriptionRequestUC } from "@school-gate/core/usecases/reviewSubscriptionRequest";
import { createOutboxRepo } from "@school-gate/infra/drizzle/repos/outbox.repo";
import { createPersonsRepo } from "@school-gate/infra/drizzle/repos/persons.repo";
import { createSubscriptionRequestsRepo } from "@school-gate/infra/drizzle/repos/subscriptionRequests.repo";
import { createSubscriptionsRepo } from "@school-gate/infra/drizzle/repos/subscriptions.repo";
import { createUnitOfWork } from "@school-gate/infra/drizzle/unitOfWork";
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

describe("API subscription requests routes", () => {
    let cleanup: () => void;
    let db: ReturnType<typeof createTestDb>["db"];
    let app: ReturnType<typeof createApiApp>;

    const prevEnv = {
        WORKER_POLL_MS: process.env.WORKER_POLL_MS,
        WORKER_BATCH: process.env.WORKER_BATCH,
        FEATURE_AUTO_RESOLVE_PERSON: process.env.FEATURE_AUTO_RESOLVE_PERSON,
        OUTBOX_POLL_MS: process.env.OUTBOX_POLL_MS,
        OUTBOX_BATCH: process.env.OUTBOX_BATCH,
        OUTBOX_MAX_ATTEMPTS: process.env.OUTBOX_MAX_ATTEMPTS,
        OUTBOX_LEASE_MS: process.env.OUTBOX_LEASE_MS,
        ACCESS_EVENTS_POLL_MS: process.env.ACCESS_EVENTS_POLL_MS,
        ACCESS_EVENTS_BATCH: process.env.ACCESS_EVENTS_BATCH,
        ACCESS_EVENTS_RETRY_DELAY_MS: process.env.ACCESS_EVENTS_RETRY_DELAY_MS,
        ACCESS_EVENTS_LEASE_MS: process.env.ACCESS_EVENTS_LEASE_MS,
        ACCESS_EVENTS_MAX_ATTEMPTS: process.env.ACCESS_EVENTS_MAX_ATTEMPTS,
        RETENTION_POLL_MS: process.env.RETENTION_POLL_MS,
        RETENTION_BATCH: process.env.RETENTION_BATCH,
        RETENTION_ACCESS_EVENTS_DAYS: process.env.RETENTION_ACCESS_EVENTS_DAYS,
        RETENTION_AUDIT_LOGS_DAYS: process.env.RETENTION_AUDIT_LOGS_DAYS
    };

    beforeAll(() => {
        process.env.WORKER_POLL_MS = "3000";
        process.env.WORKER_BATCH = "20";
        process.env.FEATURE_AUTO_RESOLVE_PERSON = "false";
        process.env.OUTBOX_POLL_MS = "1000";
        process.env.OUTBOX_BATCH = "50";
        process.env.OUTBOX_MAX_ATTEMPTS = "10";
        process.env.OUTBOX_LEASE_MS = "60000";
        process.env.ACCESS_EVENTS_POLL_MS = "1000";
        process.env.ACCESS_EVENTS_BATCH = "50";
        process.env.ACCESS_EVENTS_RETRY_DELAY_MS = "5000";
        process.env.ACCESS_EVENTS_LEASE_MS = "60000";
        process.env.ACCESS_EVENTS_MAX_ATTEMPTS = "10";
        process.env.RETENTION_POLL_MS = "300000";
        process.env.RETENTION_BATCH = "500";
        process.env.RETENTION_ACCESS_EVENTS_DAYS = "30";
        process.env.RETENTION_AUDIT_LOGS_DAYS = "30";

        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;

        const subscriptionRequestsRepo = createSubscriptionRequestsRepo(db);

        const reviewTx = createUnitOfWork(db, {
            subscriptionRequestsRepo: createSubscriptionRequestsRepo,
            subscriptionsRepo: createSubscriptionsRepo,
            outbox: createOutboxRepo
        });

        const listPending = createListPendingSubscriptionRequestsUC({
            subscriptionRequestsRepo
        });
        const review = createReviewSubscriptionRequestUC({
            tx: reviewTx,
            idGen: { nextId: () => crypto.randomUUID() },
            clock: { now: () => new Date() },
            subscriptionRequestsRepo
        });

        const runtimeSettings = createRuntimeSettingsService(db);
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
                listPending: (input) => listPending(input),
                review: (input) => review(input)
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
        process.env.OUTBOX_POLL_MS = prevEnv.OUTBOX_POLL_MS;
        process.env.OUTBOX_BATCH = prevEnv.OUTBOX_BATCH;
        process.env.OUTBOX_MAX_ATTEMPTS = prevEnv.OUTBOX_MAX_ATTEMPTS;
        process.env.OUTBOX_LEASE_MS = prevEnv.OUTBOX_LEASE_MS;
        process.env.ACCESS_EVENTS_POLL_MS = prevEnv.ACCESS_EVENTS_POLL_MS;
        process.env.ACCESS_EVENTS_BATCH = prevEnv.ACCESS_EVENTS_BATCH;
        process.env.ACCESS_EVENTS_RETRY_DELAY_MS = prevEnv.ACCESS_EVENTS_RETRY_DELAY_MS;
        process.env.ACCESS_EVENTS_LEASE_MS = prevEnv.ACCESS_EVENTS_LEASE_MS;
        process.env.ACCESS_EVENTS_MAX_ATTEMPTS = prevEnv.ACCESS_EVENTS_MAX_ATTEMPTS;
        process.env.RETENTION_POLL_MS = prevEnv.RETENTION_POLL_MS;
        process.env.RETENTION_BATCH = prevEnv.RETENTION_BATCH;
        process.env.RETENTION_ACCESS_EVENTS_DAYS = prevEnv.RETENTION_ACCESS_EVENTS_DAYS;
        process.env.RETENTION_AUDIT_LOGS_DAYS = prevEnv.RETENTION_AUDIT_LOGS_DAYS;
        cleanup();
    });

    beforeEach(async () => {
        await db.delete(outboxEvents);
        await db.delete(subscriptions);
        await db.delete(subscriptionRequests);
        await db.delete(persons);
    });

    it("GET /admin/subscription-requests lists pending requests with filters", async () => {
        const requestsRepo = createSubscriptionRequestsRepo(db);
        const personsRepo = createPersonsRepo(db);

        await personsRepo.create({ id: "p-ready", iin: "030512550999" });
        await requestsRepo.createPending({ id: "r-new", tgUserId: "tg-1", iin: "030512550123" });
        await requestsRepo.createPending({ id: "r-ready", tgUserId: "tg-2", iin: "030512550999" });
        await requestsRepo.markReadyForReview({
            id: "r-ready",
            personId: "p-ready",
            resolvedAt: new Date()
        });

        const res = await app.request(
            "/api/subscription-requests?only=ready_for_review&order=oldest&limit=10"
        );
        expect(res.status).toBe(200);

        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.requests).toHaveLength(1);
        expect(json.data.page).toMatchObject({ limit: 10, offset: 0, total: 1 });
        expect(json.data.requests[0]).toMatchObject({
            id: "r-ready",
            resolutionStatus: "ready_for_review",
            personId: "p-ready"
        });
        expect(typeof json.data.requests[0].createdAt).toBe("string");
    });

    it("GET /admin/subscription-requests supports status=not_pending", async () => {
        const requestsRepo = createSubscriptionRequestsRepo(db);

        await requestsRepo.createPending({ id: "r-pending", tgUserId: "tg-1", iin: "030512550123" });
        await requestsRepo.createPending({ id: "r-approved", tgUserId: "tg-2", iin: "030512550124" });
        await requestsRepo.updateStatus({
            id: "r-approved",
            status: "approved",
            reviewedAt: new Date(),
            reviewedBy: "admin-1"
        });

        const res = await app.request("/api/subscription-requests?status=not_pending&order=newest&limit=10");
        expect(res.status).toBe(200);

        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.page).toMatchObject({ limit: 10, offset: 0, total: 1 });
        expect(json.data.requests).toHaveLength(1);
        expect(json.data.requests[0]).toMatchObject({
            id: "r-approved",
            status: "approved"
        });
    });

    it("POST /admin/subscription-requests/:id/review approves a ready request", async () => {
        const requestsRepo = createSubscriptionRequestsRepo(db);
        const personsRepo = createPersonsRepo(db);
        const subsRepo = createSubscriptionsRepo(db);

        await personsRepo.create({ id: "p-1", iin: "030512550123" });
        await requestsRepo.createPending({ id: "r-approve", tgUserId: "tg-1", iin: "030512550123" });
        await requestsRepo.markReadyForReview({
            id: "r-approve",
            personId: "p-1",
            resolvedAt: new Date()
        });

        const res = await app.request("/api/subscription-requests/r-approve/review", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ decision: "approve", adminTgUserId: "admin-1" })
        });
        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data).toMatchObject({
            requestId: "r-approve",
            status: "approved",
            personId: "p-1"
        });

        const subs = await subsRepo.listActiveByPersonId("p-1");
        expect(subs).toHaveLength(1);
        expect(subs[0].tgUserId).toBe("tg-1");
    });

    it("POST /admin/subscription-requests/:id/review rejects a pending request", async () => {
        const requestsRepo = createSubscriptionRequestsRepo(db);

        await requestsRepo.createPending({ id: "r-reject", tgUserId: "tg-9", iin: "030512550123" });

        const res = await app.request("/api/subscription-requests/r-reject/review", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ decision: "reject", adminTgUserId: "admin-2" })
        });
        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.status).toBe("rejected");
    });

    it("POST /admin/subscription-requests/:id/review returns 409 when not ready", async () => {
        const requestsRepo = createSubscriptionRequestsRepo(db);
        await requestsRepo.createPending({ id: "r-not-ready", tgUserId: "tg-3", iin: "030512550123" });

        const res = await app.request("/api/subscription-requests/r-not-ready/review", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ decision: "approve", adminTgUserId: "admin-3" })
        });

        expect(res.status).toBe(409);
        const json = (await res.json()) as any;
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("subscription_request_not_ready");
    });

    it("POST /admin/subscription-requests/:id/review returns 404 for missing request", async () => {
        const res = await app.request("/api/subscription-requests/missing/review", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ decision: "reject", adminTgUserId: "admin-4" })
        });

        expect(res.status).toBe(404);
        const json = (await res.json()) as any;
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("subscription_request_not_found");
    });
});


