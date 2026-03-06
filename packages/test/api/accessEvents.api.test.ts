import crypto from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { accessEvents as accessEventsTable } from "@school-gate/db/schema";
import { createIngestAccessEventUC } from "@school-gate/core/usecases/ingestAccessEvent";
import { createAccessEventsRepo } from "@school-gate/infra/drizzle/repos/accessEvents.repo";
import { createPersonTerminalIdentitiesRepo } from "@school-gate/infra/drizzle/repos/personTerminalIdentities.repo";
import { createPersonsRepo } from "@school-gate/infra/drizzle/repos/persons.repo";
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
import { verifyIngestAuth } from "../../../apps/api/src/delivery/http/middleware/verifyIngestAuth.js";

function sign(secret: string, timestamp: number, rawBody: string): string {
    return crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

describe("API access events ingestion routes", () => {
    let cleanup: () => void;
    let db: ReturnType<typeof createTestDb>["db"];
    let app: ReturnType<typeof createApiApp>;

    const token = "test-core-token";
    const hmacSecret = "test-core-hmac";
    const windowMs = 60_000;

    beforeAll(() => {
        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;

        const runtimeSettings = createRuntimeSettingsService(db);
        const logger = createLogger({ name: "api-test", level: "silent" });

        const ingestAccessEvent = createIngestAccessEventUC({
            accessEventsRepo: createAccessEventsRepo(db),
            personsRepo: createPersonsRepo(db),
            personTerminalIdentitiesRepo: createPersonTerminalIdentitiesRepo(db),
            idGen: { nextId: () => crypto.randomUUID() }
        });

        const ingestAuth = verifyIngestAuth({
            token,
            hmacSecret,
            windowMs,
            now: () => Date.now()
        });

        app = createApiApp({
            logger,
            adminAuth: createAllowAllAdminAuth(),
            adminAuthModule: createStubAdminAuthHandlers(),
            admins: createStubAdminsHandlers(),
            runtimeSettings,
            accessEvents: {
                verifyIngestAuth: ingestAuth,
                module: {
                    ingest: (input) =>
                        ingestAccessEvent({
                            ...input,
                            occurredAt: new Date(input.occurredAt)
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

    afterAll(() => {
        cleanup();
    });

    beforeEach(async () => {
        await db.delete(accessEventsTable);
    });

    it("returns 401 without auth headers", async () => {
        const body = JSON.stringify({
            eventId: "e1",
            deviceId: "d1",
            direction: "IN",
            occurredAt: Date.now()
        });

        const res = await app.request("/api/events", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body
        });

        expect(res.status).toBe(401);
        const json = (await res.json()) as any;
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("unauthorized");
    });

    it("returns 401 on bad signature", async () => {
        const payload = {
            eventId: "e1",
            deviceId: "d1",
            direction: "IN" as const,
            occurredAt: Date.now()
        };
        const rawBody = JSON.stringify(payload);
        const timestamp = Date.now();

        const res = await app.request("/api/events", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${token}`,
                "x-timestamp": String(timestamp),
                "x-signature": "deadbeef"
            },
            body: rawBody
        });

        expect(res.status).toBe(401);
        const json = (await res.json()) as any;
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("unauthorized");
    });

    it("returns 401 on expired timestamp", async () => {
        const payload = {
            eventId: "e-expired",
            deviceId: "d1",
            direction: "IN" as const,
            occurredAt: Date.now()
        };
        const rawBody = JSON.stringify(payload);
        const timestamp = Date.now() - windowMs - 1_000;
        const signature = sign(hmacSecret, timestamp, rawBody);

        const res = await app.request("/api/events", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${token}`,
                "x-timestamp": String(timestamp),
                "x-signature": signature
            },
            body: rawBody
        });

        expect(res.status).toBe(401);
        const json = (await res.json()) as any;
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("unauthorized");
    });

    it("ingests a valid event and is idempotent", async () => {
        const payload = {
            eventId: "e1",
            deviceId: "d1",
            direction: "IN" as const,
            occurredAt: Date.now(),
            iin: "030512550123"
        };
        const rawBody = JSON.stringify(payload);
        const timestamp = Date.now();
        const signature = sign(hmacSecret, timestamp, rawBody);

        const first = await app.request("/api/events", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${token}`,
                "x-timestamp": String(timestamp),
                "x-signature": signature
            },
            body: rawBody
        });

        expect(first.status).toBe(200);
        const firstJson = (await first.json()) as any;
        expect(firstJson.success).toBe(true);
        expect(firstJson.data.result).toBe("inserted");
        expect(firstJson.data.status).toBe("NEW");

        const second = await app.request("/api/events", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${token}`,
                "x-timestamp": String(timestamp),
                "x-signature": signature
            },
            body: rawBody
        });

        expect(second.status).toBe(200);
        const secondJson = (await second.json()) as any;
        expect(secondJson.success).toBe(true);
        expect(secondJson.data.result).toBe("duplicate");

        const rows = await db
            .select()
            .from(accessEventsTable)
            .where(eq(accessEventsTable.idempotencyKey, "d1:e1"));
        expect(rows).toHaveLength(1);
    });

    it("ingests a valid batch", async () => {
        const payload = {
            events: [
                {
                    eventId: "b1",
                    deviceId: "d1",
                    direction: "IN" as const,
                    occurredAt: Date.now(),
                    iin: "030512550123"
                },
                {
                    eventId: "b2",
                    deviceId: "d1",
                    direction: "OUT" as const,
                    occurredAt: Date.now(),
                    iin: "030512550123"
                }
            ]
        };
        const rawBody = JSON.stringify(payload);
        const timestamp = Date.now();
        const signature = sign(hmacSecret, timestamp, rawBody);

        const res = await app.request("/api/events/batch", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${token}`,
                "x-timestamp": String(timestamp),
                "x-signature": signature
            },
            body: rawBody
        });

        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.results).toHaveLength(2);
        expect(json.data.results[0].result).toBe("inserted");
        expect(json.data.results[1].result).toBe("inserted");
    });
});



