import crypto from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { accessEvents, personTerminalIdentities, persons } from "@school-gate/db/schema";
import { createMapPersonTerminalIdentityUC } from "@school-gate/core";
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
import type { ListAccessEventsResultDto } from "@school-gate/contracts";

describe("API access events admin routes", () => {
    let cleanup: () => void;
    let db: ReturnType<typeof createTestDb>["db"];
    let app: ReturnType<typeof createApiApp>;

    beforeAll(() => {
        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;

        const accessEventsRepo = createAccessEventsRepo(db);
        const personsRepo = createPersonsRepo(db);
        const ptiRepo = createPersonTerminalIdentitiesRepo(db);

        const runtimeSettings = createRuntimeSettingsService(db);
        const logger = createLogger({ name: "api-test", level: "silent" });

        const mapIdentity = createMapPersonTerminalIdentityUC({
            personsRepo,
            personTerminalIdentitiesRepo: ptiRepo,
            accessEventsRepo,
            idGen: { nextId: () => crypto.randomUUID() }
        });

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
                list: async (input) => {
                    const { events, total } = await accessEventsRepo.list({
                        limit: input.limit,
                        offset: input.offset,
                        ...(input.status ? { status: input.status } : {}),
                        ...(input.direction ? { direction: input.direction } : {}),
                        ...(input.deviceId ? { deviceId: input.deviceId } : {}),
                        ...(input.iin ? { iin: input.iin } : {}),
                        ...(input.terminalPersonId ? { terminalPersonId: input.terminalPersonId } : {}),
                        ...(input.from ? { from: new Date(input.from) } : {}),
                        ...(input.to ? { to: new Date(input.to) } : {})
                    });
                    const data: ListAccessEventsResultDto = {
                        events: events.map((event) => ({
                            id: event.id,
                            deviceId: event.deviceId,
                            direction: event.direction,
                            occurredAt: event.occurredAt.toISOString(),
                            terminalPersonId: event.terminalPersonId,
                            iin: event.iin,
                            status: event.status,
                            attempts: event.attempts,
                            lastError: event.lastError,
                            person: null,
                            processedAt: event.processedAt ? event.processedAt.toISOString() : null,
                            createdAt: event.createdAt.toISOString()
                        })),
                        page: {
                            limit: input.limit,
                            offset: input.offset,
                            total
                        }
                    };
                    return data;
                },
                listUnmatched: ({ limit }) => accessEventsRepo.listUnmatched({ limit }),
                mapTerminalIdentity: (input) => mapIdentity(input)
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
        await db.delete(accessEvents);
        await db.delete(personTerminalIdentities);
        await db.delete(persons);
    });

    it("lists unmatched access events", async () => {
        const repo = createAccessEventsRepo(db);
        await repo.insertIdempotent({
            id: "ev-1",
            deviceId: "dev-1",
            direction: "IN",
            occurredAt: new Date(),
            terminalPersonId: "T-1",
            idempotencyKey: "dev-1:ev-1",
            status: "UNMATCHED"
        });

        const res = await app.request("/api/access-events/unmatched?limit=10");
        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.events).toHaveLength(1);
        expect(json.data.events[0]).toMatchObject({
            id: "ev-1",
            deviceId: "dev-1",
            terminalPersonId: "T-1",
            status: "UNMATCHED"
        });
    });

    it("lists access events with pagination and filters", async () => {
        const repo = createAccessEventsRepo(db);
        const now = new Date();

        await repo.insertIdempotent({
            id: "ev-all-1",
            deviceId: "dev-1",
            direction: "IN",
            occurredAt: now,
            terminalPersonId: "T-10",
            idempotencyKey: "dev-1:ev-all-1",
            status: "UNMATCHED"
        });
        await repo.insertIdempotent({
            id: "ev-all-2",
            deviceId: "dev-2",
            direction: "OUT",
            occurredAt: new Date(now.getTime() + 1_000),
            terminalPersonId: "T-20",
            idempotencyKey: "dev-2:ev-all-2",
            status: "NEW"
        });

        const res = await app.request("/api/access-events?status=UNMATCHED&limit=10&offset=0");
        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.page).toMatchObject({
            limit: 10,
            offset: 0,
            total: 1
        });
        expect(json.data.events).toHaveLength(1);
        expect(json.data.events[0]).toMatchObject({
            id: "ev-all-1",
            status: "UNMATCHED",
            attempts: 0
        });
    });

    it("maps terminal identity and requeues unmatched events", async () => {
        const accessEventsRepo = createAccessEventsRepo(db);
        const personsRepo = createPersonsRepo(db);

        await personsRepo.create({ id: "p-1", iin: "030512550123" });
        await accessEventsRepo.insertIdempotent({
            id: "ev-2",
            deviceId: "dev-1",
            direction: "OUT",
            occurredAt: new Date(),
            terminalPersonId: "T-2",
            idempotencyKey: "dev-1:ev-2",
            status: "UNMATCHED"
        });

        const mapRes = await app.request("/api/access-events/mappings", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                personId: "p-1",
                deviceId: "dev-1",
                terminalPersonId: "T-2"
            })
        });

        expect(mapRes.status).toBe(200);
        const mapJson = (await mapRes.json()) as any;
        expect(mapJson.success).toBe(true);
        expect(mapJson.data.status).toBe("linked");
        expect(mapJson.data.updatedEvents).toBe(1);

        const unmatchedRes = await app.request("/api/access-events/unmatched?limit=10");
        const unmatchedJson = (await unmatchedRes.json()) as any;
        expect(unmatchedJson.success).toBe(true);
        expect(unmatchedJson.data.events).toHaveLength(0);
    });

    it("returns 404 when mapping to a missing person", async () => {
        const res = await app.request("/api/access-events/mappings", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                personId: "missing",
                deviceId: "dev-1",
                terminalPersonId: "T-404"
            })
        });

        expect(res.status).toBe(404);
        const json = (await res.json()) as any;
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("person_not_found");
    });

    it("returns 409 when mapping conflicts with an existing person", async () => {
        const personsRepo = createPersonsRepo(db);
        const ptiRepo = createPersonTerminalIdentitiesRepo(db);

        await personsRepo.create({ id: "p-1", iin: "030512550123" });
        await personsRepo.create({ id: "p-2", iin: "030512550999" });
        await ptiRepo.upsert({
            id: "pti-1",
            personId: "p-1",
            deviceId: "dev-1",
            terminalPersonId: "T-1"
        });

        const res = await app.request("/api/access-events/mappings", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                personId: "p-2",
                deviceId: "dev-1",
                terminalPersonId: "T-1"
            })
        });

        expect(res.status).toBe(409);
        const json = (await res.json()) as any;
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("terminal_identity_conflict");
    });
});



