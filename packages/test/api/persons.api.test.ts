import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { personTerminalIdentities, persons as personsTable } from "@school-gate/db/schema";
import { createSearchPersonsByIinUC } from "@school-gate/core/usecases/searchPersonsByIin";
import { createPersonsRepo } from "@school-gate/infra/drizzle/repos/persons.repo";
import { createRuntimeSettingsService } from "@school-gate/infra";
import { createLogger } from "@school-gate/infra/logging/logger";
import {
    createAllowAllAdminAuth,
    createStubAdminAuthHandlers,
    createStubAlertsHandlers,
    createStubAdminsHandlers,
    createStubAuditLogsHandlers,
    createStubSubscriptionsHandlers,
} from "../helpers/adminAuth.js";
import { createTestDb } from "../helpers/testDb.js";
import { createApiApp } from "../../../apps/api/src/app.js";

describe("API persons routes", () => {
    let cleanup: () => void;
    let db: ReturnType<typeof createTestDb>["db"];
    let app: ReturnType<typeof createApiApp>;

    beforeAll(() => {
        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;

        const personsRepo = createPersonsRepo(db);
        const searchByIin = createSearchPersonsByIinUC({ personsRepo });

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
                        accessEventId: null,
                    }),
                },
            },
            accessEventsAdmin: {
                listUnmatched: async () => [],
                mapTerminalIdentity: async () => ({ status: "already_linked", updatedEvents: 0 }),
            },
            persons: {
                searchByIin: (input) => searchByIin(input),
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
        await db.delete(personTerminalIdentities);
        await db.delete(personsTable);
    });

    it("searches by prefix and by full iin", async () => {
        const repo = createPersonsRepo(db);
        await repo.create({ id: "p1", iin: "030512550123" });
        await repo.create({ id: "p2", iin: "030512550999" });
        await repo.create({ id: "p3", iin: "990512550999" });

        const prefixRes = await app.request("/api/persons?iin=0305&limit=10");
        expect(prefixRes.status).toBe(200);
        const prefixJson = (await prefixRes.json()) as any;
        expect(prefixJson.success).toBe(true);
        expect(prefixJson.data.persons).toHaveLength(2);
        expect(prefixJson.data.page).toMatchObject({ limit: 10, offset: 0, total: 2 });
        expect(prefixJson.data.persons[0].iin.startsWith("0305")).toBe(true);

        const fullRes = await app.request("/api/persons?iin=030512550123&limit=10");
        expect(fullRes.status).toBe(200);
        const fullJson = (await fullRes.json()) as any;
        expect(fullJson.success).toBe(true);
        expect(fullJson.data.persons).toHaveLength(1);
        expect(fullJson.data.page).toMatchObject({ limit: 10, offset: 0, total: 1 });
        expect(fullJson.data.persons[0].iin).toBe("030512550123");
    });

    it("validates iin query", async () => {
        const badChars = await app.request("/api/persons?iin=abc&limit=10");
        expect(badChars.status).toBe(400);
        const badCharsJson = (await badChars.json()) as any;
        expect(badCharsJson.success).toBe(false);
        expect(badCharsJson.error.code).toBe("validation_error");

        const tooLong = await app.request("/api/persons?iin=1234567890123&limit=10");
        expect(tooLong.status).toBe(400);
        const tooLongJson = (await tooLong.json()) as any;
        expect(tooLongJson.success).toBe(false);
        expect(tooLongJson.error.code).toBe("validation_error");
    });
});



