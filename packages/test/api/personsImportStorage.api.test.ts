import Database from "better-sqlite3";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createLogger } from "@school-gate/infra/logging/logger";
import { createRuntimeSettingsService } from "@school-gate/infra";
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
import { createTestDb } from "../helpers/testDb.js";

function createPersonsImportApp(db: ReturnType<typeof createTestDb>["db"]) {
    let sequence = 0;
    const logger = createLogger({ name: "persons-import-storage-test", level: "silent" });
    const runtimeSettings = createRuntimeSettingsService(db);
    const feature = createEventsFeature(
        {
            dbClient: { db },
            logger,
            clock: { now: () => new Date("2026-03-02T10:40:00.000Z") },
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
            listDevices: async () => ({ devices: [] }),
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
            createUsers: async () => ({ results: [] }),
            updateUsers: async () => ({ results: [] })
        }
    );

    return createApiApp({
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
}

describe("API persons import storage guards", () => {
    let cleanup: () => void;
    let db: ReturnType<typeof createTestDb>["db"];
    let app: ReturnType<typeof createApiApp>;

    beforeAll(() => {
        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;

        const sqlite = new Database(tdb.dbFile);
        sqlite.exec("DROP TABLE terminal_directory_entries;");
        sqlite.exec("DROP TABLE terminal_directory_sync_runs;");
        sqlite.close();

        app = createPersonsImportApp(db);
    });

    afterAll(() => {
        cleanup();
    });

    it("returns empty import candidates when snapshot storage is missing", async () => {
        const response = await app.request("/api/persons/import-candidates?limit=20&offset=0");
        expect(response.status).toBe(200);

        const json = (await response.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.groups).toEqual([]);
        expect(json.data.page).toEqual({ limit: 20, offset: 0, total: 0 });
        expect(json.data.summary.ready_create).toBe(0);
    });

    it("returns explicit storage error for sync run creation when tables are missing", async () => {
        const response = await app.request("/api/persons/import-runs", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                deviceIds: ["dev-main"],
                includeCards: true,
                pageSize: 100
            })
        });

        expect(response.status).toBe(503);
        const json = (await response.json()) as any;
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("persons_import_storage_not_initialized");
    });
});
