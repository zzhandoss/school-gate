import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { personTerminalIdentities, persons as personsTable, terminalDirectoryEntries, terminalDirectorySyncRuns } from "@school-gate/db/schema";
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

describe("API persons import routes", () => {
    let cleanup: () => void;
    let db: ReturnType<typeof createTestDb>["db"];
    let app: ReturnType<typeof createApiApp>;

    beforeAll(() => {
        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;

        let sequence = 0;
        const logger = createLogger({ name: "persons-import-test", level: "silent" });
        const runtimeSettings = createRuntimeSettingsService(db);
        const feature = createEventsFeature(
            {
                dbClient: { db },
                logger,
                clock: { now: () => new Date("2026-03-01T00:00:00.000Z") },
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
                                        sources: ["accessUser"],
                                        paramsTemplate: {
                                            "accessUser.Condition.UserID": "{{identityValue}}"
                                        }
                                    }
                                }
                            }),
                            createdAt: "2026-03-01T00:00:00.000Z",
                            updatedAt: "2026-03-01T00:00:00.000Z"
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
                                        sources: ["accessUser"],
                                        paramsTemplate: {
                                            "accessUser.Condition.UserID": "{{identityValue}}"
                                        }
                                    }
                                }
                            }),
                            createdAt: "2026-03-01T00:00:00.000Z",
                            updatedAt: "2026-03-01T00:00:00.000Z"
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
                exportUsers: async ({ payload }) => {
                    const deviceId =
                        payload.target.mode === "device"
                            ? payload.target.deviceId
                            : payload.target.mode === "devices"
                                ? payload.target.deviceIds[0]!
                                : "dev-1";

                    if (deviceId === "dev-1") {
                        return {
                            view: "grouped",
                            devices: [
                                {
                                    deviceId,
                                    exportedCount: 2,
                                    failed: false,
                                    hasMore: false,
                                    users: [
                                        {
                                            deviceId,
                                            terminalPersonId: "T-1",
                                            displayName: "Ivan Petrov",
                                            citizenIdNo: null,
                                            sourceSummary: ["accessUser"],
                                            rawUserPayload: JSON.stringify({ UserID: "900101000001" })
                                        },
                                        {
                                            deviceId,
                                            terminalPersonId: "T-2",
                                            displayName: "No IIN User",
                                            citizenIdNo: null,
                                            sourceSummary: ["accessUser"],
                                            rawUserPayload: JSON.stringify({ UserID: "not-an-iin" })
                                        }
                                    ]
                                }
                            ]
                        };
                    }

                    return {
                        view: "grouped",
                        devices: [
                            {
                                deviceId,
                                exportedCount: 1,
                                failed: false,
                                hasMore: false,
                                users: [
                                    {
                                        deviceId,
                                        terminalPersonId: "T-1",
                                        displayName: "Ivan Petrov",
                                        citizenIdNo: null,
                                        sourceSummary: ["accessUser"],
                                        rawUserPayload: JSON.stringify({ UserID: "900101000001" })
                                    }
                                ]
                            }
                        ]
                    };
                },
                createUsers: async () => ({ results: [] }),
                updateUsers: async () => ({ results: [] })
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
        await db.delete(personTerminalIdentities);
        await db.delete(terminalDirectoryEntries);
        await db.delete(terminalDirectorySyncRuns);
        await db.delete(personsTable);
    });

    it("syncs terminal users and classifies import candidates", async () => {
        const syncResponse = await app.request("/api/persons/import-runs", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                deviceIds: ["dev-1", "dev-2"],
                includeCards: true,
                pageSize: 100
            })
        });
        expect(syncResponse.status).toBe(200);

        const syncJson = (await syncResponse.json()) as any;
        expect(syncJson.success).toBe(true);
        expect(syncJson.data.run.summary.entryCount).toBe(3);
        expect(syncJson.data.run.summary.errors).toEqual([]);

        const candidatesResponse = await app.request("/api/persons/import-candidates?limit=20&offset=0");
        expect(candidatesResponse.status).toBe(200);
        const candidatesJson = (await candidatesResponse.json()) as any;
        expect(candidatesJson.success).toBe(true);
        expect(candidatesJson.data.summary.ready_create).toBe(1);
        expect(candidatesJson.data.summary.missing_iin).toBe(1);

        const readyCreate = candidatesJson.data.groups.find((group: any) => group.status === "ready_create");
        expect(readyCreate.entries).toHaveLength(2);
        expect(readyCreate.iin).toBe("900101000001");
    });

    it("applies create-person-and-link operations from import candidates", async () => {
        await app.request("/api/persons/import-runs", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                deviceIds: ["dev-1", "dev-2"],
                includeCards: true,
                pageSize: 100
            })
        });

        const candidatesResponse = await app.request("/api/persons/import-candidates?limit=20&offset=0");
        const candidatesJson = (await candidatesResponse.json()) as any;
        const readyCreate = candidatesJson.data.groups.find((group: any) => group.status === "ready_create");

        const applyResponse = await app.request("/api/persons/import/apply", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                operations: [
                    {
                        type: "create_person_and_link",
                        directoryEntryIds: readyCreate.entries.map((entry: any) => entry.directoryEntryId),
                        personDraft: {
                            iin: "900101000001",
                            firstName: "Ivan",
                            lastName: "Petrov"
                        }
                    }
                ]
            })
        });

        expect(applyResponse.status).toBe(200);
        const applyJson = (await applyResponse.json()) as any;
        expect(applyJson.success).toBe(true);
        expect(applyJson.data.applied).toBe(1);

        const personsResponse = await app.request("/api/persons?limit=20&offset=0");
        const personsJson = (await personsResponse.json()) as any;
        expect(personsJson.data.persons).toHaveLength(1);
        expect(personsJson.data.persons[0].iin).toBe("900101000001");

        const candidatesAfterResponse = await app.request("/api/persons/import-candidates?limit=20&offset=0");
        const candidatesAfterJson = (await candidatesAfterResponse.json()) as any;
        expect(candidatesAfterJson.data.summary.already_linked).toBe(1);
    });
});
