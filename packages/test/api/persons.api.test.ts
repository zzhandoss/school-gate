import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { personTerminalIdentities, persons as personsTable } from "@school-gate/db/schema";
import { createSearchPersonsByIinUC } from "@school-gate/core/usecases/searchPersonsByIin";
import { PersonNotFoundError } from "@school-gate/core/utils/errors";
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
                        accessEventId: null
                    })
                }
            },
            accessEventsAdmin: {
                listUnmatched: async () => [],
                mapTerminalIdentity: async () => ({ status: "already_linked", updatedEvents: 0 })
            },
            persons: {
                searchByIin: (input) => searchByIin(input),
                list: async ({ limit, offset, iin, query, linkedStatus, includeDeviceIds, excludeDeviceIds }) => {
                    const parseCsvIds = (value?: string) => value
                        ? Array.from(new Set(value.split(",").map((item) => item.trim()).filter((item) => item.length > 0)))
                        : undefined;
                    const repo = createPersonsRepo(db);
                    const normalizedIncludeDeviceIds = parseCsvIds(includeDeviceIds);
                    const normalizedExcludeDeviceIds = parseCsvIds(excludeDeviceIds);
                    const persons = await repo.list({ limit, offset, iin, query, linkedStatus, includeDeviceIds: normalizedIncludeDeviceIds, excludeDeviceIds: normalizedExcludeDeviceIds });
                    const total = await repo.count({ iin, query, linkedStatus, includeDeviceIds: normalizedIncludeDeviceIds, excludeDeviceIds: normalizedExcludeDeviceIds });
                    const linkedIdentities = await db.select().from(personTerminalIdentities);
                    const hasDeviceIdentitiesByPersonId = new Set(linkedIdentities.map((identity) => identity.personId));
                    return {
                        persons: persons.map((person) => ({
                            id: person.id,
                            iin: person.iin,
                            terminalPersonId: person.terminalPersonId,
                            hasDeviceIdentities: hasDeviceIdentitiesByPersonId.has(person.id),
                            firstName: person.firstName,
                            lastName: person.lastName,
                            createdAt: person.createdAt.toISOString()
                        })),
                        page: { limit, offset, total }
                    };
                },
                deleteById: async ({ personId }) => {
                    if (personId === "missing") {
                        throw new PersonNotFoundError();
                    }

                    return {
                        personId,
                        deleted: true,
                        detachedIdentities: 1,
                        deactivatedSubscriptions: 2,
                        unlinkedRequests: 3,
                        resetRequestsToNeedsPerson: 1
                    };
                },
                bulkDelete: async ({ body }) => ({
                    total: body.personIds.length,
                    deleted: Math.min(1, body.personIds.length),
                    notFound: Math.max(0, body.personIds.length - 1),
                    errors: 0,
                    results: body.personIds.map((personId, index) =>
                        index === 0
                            ? {
                                personId,
                                status: "deleted" as const,
                                deleted: true as const,
                                detachedIdentities: 0,
                                deactivatedSubscriptions: 0,
                                unlinkedRequests: 0,
                                resetRequestsToNeedsPerson: 0
                            }
                            : {
                                personId,
                                status: "not_found" as const,
                                message: "Person was not found"
                            }
                    )
                }),
                bulkCreateTerminalUsers: async ({ body }) => ({
                    totalPersons: body.personIds.length,
                    total: body.personIds.length * body.deviceIds.length,
                    success: body.personIds.length * body.deviceIds.length,
                    failed: 0,
                    results: body.personIds.map((personId) => ({
                        personId,
                        userId: personId,
                        total: body.deviceIds.length,
                        success: body.deviceIds.length,
                        failed: 0,
                        results: body.deviceIds.map((deviceId) => ({
                            deviceId,
                            operation: "create" as const,
                            status: "success" as const,
                            steps: {
                                accessUser: "success" as const,
                                accessCard: "skipped" as const,
                                accessFace: "skipped" as const
                            }
                        }))
                    }))
                })
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

    it("lists persons with linked filters", async () => {
        const repo = createPersonsRepo(db);
        await repo.create({ id: "p1", iin: "030512550123" });
        await repo.create({ id: "p2", iin: "030512550124" });
        await db.insert(personTerminalIdentities).values({
            id: "pti-1",
            personId: "p1",
            deviceId: "dev-1",
            terminalPersonId: "T-1"
        });

        const linkedResponse = await app.request("/api/persons?limit=10&offset=0&linkedStatus=linked");
        expect(linkedResponse.status).toBe(200);

        const linkedJson = (await linkedResponse.json()) as any;
        expect(linkedJson.success).toBe(true);
        expect(linkedJson.data.page).toMatchObject({ limit: 10, offset: 0, total: 1 });
        expect(linkedJson.data.persons).toHaveLength(1);
        expect(linkedJson.data.persons[0]).toMatchObject({ id: "p1", hasDeviceIdentities: true });

        const unlinkedResponse = await app.request("/api/persons?limit=10&offset=0&linkedStatus=unlinked");
        expect(unlinkedResponse.status).toBe(200);

        const unlinkedJson = (await unlinkedResponse.json()) as any;
        expect(unlinkedJson.success).toBe(true);
        expect(unlinkedJson.data.page).toMatchObject({ limit: 10, offset: 0, total: 1 });
        expect(unlinkedJson.data.persons).toHaveLength(1);
        expect(unlinkedJson.data.persons[0]).toMatchObject({ id: "p2", hasDeviceIdentities: false });

        const includeDeviceResponse = await app.request("/api/persons?limit=10&offset=0&includeDeviceIds=dev-1");
        expect(includeDeviceResponse.status).toBe(200);

        const includeDeviceJson = (await includeDeviceResponse.json()) as any;
        expect(includeDeviceJson.success).toBe(true);
        expect(includeDeviceJson.data.page).toMatchObject({ limit: 10, offset: 0, total: 1 });
        expect(includeDeviceJson.data.persons).toHaveLength(1);
        expect(includeDeviceJson.data.persons[0]).toMatchObject({ id: "p1" });

        const excludeDeviceResponse = await app.request("/api/persons?limit=10&offset=0&excludeDeviceIds=dev-1");
        expect(excludeDeviceResponse.status).toBe(200);

        const excludeDeviceJson = (await excludeDeviceResponse.json()) as any;
        expect(excludeDeviceJson.success).toBe(true);
        expect(excludeDeviceJson.data.page).toMatchObject({ limit: 10, offset: 0, total: 1 });
        expect(excludeDeviceJson.data.persons).toHaveLength(1);
        expect(excludeDeviceJson.data.persons[0]).toMatchObject({ id: "p2" });
    });

    it("deletes a person", async () => {
        const response = await app.request("/api/persons/p1", {
            method: "DELETE"
        });

        expect(response.status).toBe(200);
        const json = (await response.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data).toEqual({
            personId: "p1",
            deleted: true,
            detachedIdentities: 1,
            deactivatedSubscriptions: 2,
            unlinkedRequests: 3,
            resetRequestsToNeedsPerson: 1
        });
    });

    it("bulk deletes persons and validates request body", async () => {
        const response = await app.request("/api/persons/bulk-delete", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                personIds: ["p1", "missing"]
            })
        });

        expect(response.status).toBe(200);
        const json = (await response.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.total).toBe(2);
        expect(json.data.deleted).toBe(1);
        expect(json.data.notFound).toBe(1);

        const invalid = await app.request("/api/persons/bulk-delete", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                personIds: []
            })
        });

        expect(invalid.status).toBe(400);
        const invalidJson = (await invalid.json()) as any;
        expect(invalidJson.success).toBe(false);
        expect(invalidJson.error.code).toBe("validation_error");
    });

    it("bulk creates terminal users for selected persons", async () => {
        const response = await app.request("/api/persons/terminal-users/bulk-create", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                personIds: ["p1", "p2"],
                deviceIds: ["dev-1"],
                validFrom: "2026-03-06 08:00:00",
                validTo: "2027-03-06 08:00:00"
            })
        });

        expect(response.status).toBe(200);
        const json = (await response.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.totalPersons).toBe(2);
        expect(json.data.success).toBe(2);
    });
});



