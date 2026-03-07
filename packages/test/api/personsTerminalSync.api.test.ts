import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { personTerminalIdentities, persons as personsTable } from "@school-gate/db/schema";
import { createLogger } from "@school-gate/infra/logging/logger";
import { createApiApp } from "../../../apps/api/src/app.js";
import { createEventsFeature } from "../../../apps/api/src/composition/features/events.feature.js";
import {
    createAllowAllAdminAuth,
    createStubAdminAuthHandlers,
    createStubAdminsHandlers,
    createStubAlertsHandlers,
    createStubAuditLogsHandlers,
    createStubSubscriptionsHandlers
} from "../helpers/adminAuth.js";
import { createRuntimeSettingsService } from "@school-gate/infra";
import { createTestDb } from "../helpers/testDb.js";

describe("API persons terminal sync routes", () => {
    let cleanup: () => void;
    let db: ReturnType<typeof createTestDb>["db"];
    let app: ReturnType<typeof createApiApp>;
    const createCalls: Array<any> = [];
    const updateCalls: Array<any> = [];

    beforeAll(() => {
        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;

        let sequence = 0;
        const logger = createLogger({ name: "persons-terminal-sync-test", level: "silent" });
        const runtimeSettings = createRuntimeSettingsService(db);
        const feature = createEventsFeature(
            {
                dbClient: { db },
                logger,
                clock: { now: () => new Date("2026-03-02T00:00:00.000Z") },
                idGen: { nextId: () => `id-${++sequence}` },
                accessCfg: {
                    processingBy: "test-worker",
                    leaseMs: 1000,
                    retryDelayMs: 1000,
                    maxAttempts: 3
                },
                apiConfig: {
                    accessEventsInlineMaxInFlight: 10
                }
            } as any,
            {
                listDevices: async () => ({
                    devices: [
                        {
                            deviceId: "dev-1",
                            name: "Device 1",
                            direction: "IN",
                            adapterKey: "dahua",
                            enabled: true,
                            settingsJson: JSON.stringify({
                                identityQueryMappings: {
                                    iin: {
                                        provider: "dahua.accessControlIdentity",
                                        paramsTemplate: {
                                            "accessUser.Condition.UserID": "{{identityValue}}"
                                        }
                                    }
                                }
                            }),
                            createdAt: "2026-03-02T00:00:00.000Z",
                            updatedAt: "2026-03-02T00:00:00.000Z"
                        },
                        {
                            deviceId: "dev-2",
                            name: "Device 2",
                            direction: "IN",
                            adapterKey: "dahua",
                            enabled: true,
                            settingsJson: JSON.stringify({
                                identityQueryMappings: {
                                    iin: {
                                        provider: "dahua.accessControlIdentity",
                                        paramsTemplate: {
                                            "accessUser.Condition.UserID": "{{identityValue}}"
                                        }
                                    }
                                }
                            }),
                            createdAt: "2026-03-02T00:00:00.000Z",
                            updatedAt: "2026-03-02T00:00:00.000Z"
                        }
                    ]
                }),
                getDevice: async () => ({ device: {} as never }),
                upsertDevice: async () => ({ ok: true }),
                updateDevice: async () => ({ ok: true }),
                setDeviceEnabled: async () => ({ ok: true }),
                deleteDevice: async () => ({ ok: true }),
                listAdapters: async () => ({ adapters: [] }),
                getMonitoring: async () => ({ adapters: [], devices: [], outbox: { counts: { new: 0, processing: 0, processed: 0, error: 0 }, oldestNewCreatedAt: null } }),
                findIdentity: async () => ({
                    identityKey: "iin",
                    identityValue: "900101000001",
                    matches: [],
                    diagnostics: {
                        adaptersScanned: 0,
                        devicesScanned: 0,
                        devicesEligible: 0,
                        requestsSent: 0,
                        errors: 0
                    },
                    errors: []
                }),
                exportUsers: async () => ({ view: "grouped", devices: [] }),
                createUsers: async ({ payload }) => {
                    createCalls.push(payload);
                    const deviceIds = payload.target.mode === "device" ? [payload.target.deviceId] : payload.target.deviceIds;
                    return {
                        results: deviceIds.map((deviceId) => ({
                            deviceId,
                            operation: "create" as const,
                            status: "success" as const,
                            steps: {
                                accessUser: "success" as const,
                                accessCard: "skipped" as const,
                                accessFace: "skipped" as const
                            }
                        }))
                    };
                },
                updateUsers: async ({ payload }) => {
                    updateCalls.push(payload);
                    const deviceIds = payload.target.mode === "device" ? [payload.target.deviceId] : payload.target.deviceIds;
                    return {
                        results: deviceIds.map((deviceId) => ({
                            deviceId,
                            operation: "update" as const,
                            status: "success" as const,
                            steps: {
                                accessUser: "success" as const,
                                accessCard: "skipped" as const,
                                accessFace: "skipped" as const
                            }
                        }))
                    };
                }
            }
        );

        app = createApiApp({
            logger,
            adminAuth: createAllowAllAdminAuth(),
            adminAuthModule: createStubAdminAuthHandlers(),
            admins: createStubAdminsHandlers(),
            runtimeSettings,
            accessEvents: feature.accessEvents,
            accessEventsAdmin: feature.accessEventsAdmin,
            persons: feature.persons,
            subscriptionRequests: {
                listPending: async () => ({ requests: [], page: { limit: 50, offset: 0, total: 0 } }),
                review: async () => ({ requestId: "r1", status: "rejected", personId: null })
            },
            subscriptions: createStubSubscriptionsHandlers(),
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
                        counts: { NEW: 0, PROCESSING: 0, PROCESSED: 0, FAILED_RETRY: 0, UNMATCHED: 0, ERROR: 0 },
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
                listSnapshots: async () => ({ snapshots: [] })
            },
            alerts: createStubAlertsHandlers(),
            auditLogs: createStubAuditLogsHandlers()
        });
    });

    afterAll(() => {
        cleanup();
    });

    beforeEach(async () => {
        createCalls.length = 0;
        updateCalls.length = 0;
        await db.delete(personTerminalIdentities);
        await db.delete(personsTable);
    });

    it("creates person on selected terminals and stores successful mappings", async () => {
        await app.request("/api/persons", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                iin: "900101000001",
                firstName: "Ivan",
                lastName: "Petrov"
            })
        });

        const personsResponse = await app.request("/api/persons?limit=20&offset=0");
        const personsJson = (await personsResponse.json()) as any;
        const personId = personsJson.data.persons[0].id as string;

        const response = await app.request(`/api/persons/${personId}/terminal-users/create`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                deviceIds: ["dev-1", "dev-2"],
                terminalPersonId: "T-9001"
            })
        });
        expect(response.status).toBe(200);

        const json = (await response.json()) as any;
        expect(json.data.success).toBe(2);
        expect(createCalls).toHaveLength(1);
        expect(createCalls[0].person.userId).toBe("T-9001");

        const identitiesResponse = await app.request(`/api/persons/${personId}/identities`);
        const identitiesJson = (await identitiesResponse.json()) as any;
        expect(identitiesJson.data.identities).toHaveLength(2);
    });

    it("updates linked terminal users using existing device identities by default", async () => {
        const createResponse = await app.request("/api/persons", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                iin: "900101000001",
                firstName: "Ivan",
                lastName: "Petrov"
            })
        });
        const createJson = (await createResponse.json()) as any;
        const personId = createJson.data.person.id as string;

        await app.request(`/api/persons/${personId}/identities`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                deviceId: "dev-1",
                terminalPersonId: "T-1"
            })
        });
        await app.request(`/api/persons/${personId}/identities`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                deviceId: "dev-2",
                terminalPersonId: "T-2"
            })
        });

        const response = await app.request(`/api/persons/${personId}/terminal-users/update`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({})
        });
        expect(response.status).toBe(200);

        const json = (await response.json()) as any;
        expect(json.data.total).toBe(2);
        expect(updateCalls).toHaveLength(2);
        expect(updateCalls.map((item) => item.person.userId).sort()).toEqual(["T-1", "T-2"]);
    });

    it("bulk creates terminal users with iin fallback when no terminal identity exists yet", async () => {
        const createResponse = await app.request("/api/persons", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                iin: "900101000001",
                firstName: "Ivan",
                lastName: "Petrov"
            })
        });
        const createJson = (await createResponse.json()) as any;
        const personId = createJson.data.person.id as string;

        const response = await app.request("/api/persons/terminal-users/bulk-create", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                personIds: [personId],
                deviceIds: ["dev-1"],
                validFrom: "2026-03-06 08:00:00",
                validTo: "2027-03-06 08:00:00"
            })
        });
        expect(response.status).toBe(200);

        const json = (await response.json()) as any;
        expect(json.data.totalPersons).toBe(1);
        expect(json.data.success).toBe(1);
        expect(createCalls).toHaveLength(1);
        expect(createCalls[0].person.userId).toBe("900101000001");

        const identitiesResponse = await app.request(`/api/persons/${personId}/identities`);
        const identitiesJson = (await identitiesResponse.json()) as any;
        expect(identitiesJson.data.identities).toHaveLength(1);
        expect(identitiesJson.data.identities[0].terminalPersonId).toBe("900101000001");
    });
});
