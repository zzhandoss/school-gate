import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { accessEvents, outboxEvents, workerHeartbeats, monitoringSnapshots } from "@school-gate/db/schema";
import { createGetMonitoringSnapshotUC } from "@school-gate/core/usecases/getMonitoringSnapshot";
import { createMonitoringRepo } from "@school-gate/infra/drizzle/repos/monitoring.repo";
import { createMonitoringSnapshotsRepo } from "@school-gate/infra/drizzle/repos/monitoringSnapshots.repo";
import { createRuntimeSettingsService } from "@school-gate/infra";
import { createLogger } from "@school-gate/infra/logging/logger";
import type { MonitoringSnapshot } from "@school-gate/core/ports/monitoring";
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
import { createListMonitoringSnapshotsUC } from "@school-gate/core/usecases/listMonitoringSnapshots";

describe("API monitoring routes", () => {
    let cleanup: () => void;
    let db: ReturnType<typeof createTestDb>["db"];
    let app: ReturnType<typeof createApiApp>;

    const now = new Date("2026-01-15T00:00:00.000Z");
    const older = new Date("2025-12-01T00:00:00.000Z");
    const old = new Date("2026-01-01T00:00:00.000Z");
    const newer = new Date("2026-01-10T00:00:00.000Z");

    beforeAll(() => {
        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;

        const monitoringRepo = createMonitoringRepo(db);
        const componentsProvider = {
            listComponents: async () => [],
            getDeviceServiceMonitoring: async () => null
        };
        const getSnapshot = createGetMonitoringSnapshotUC({
            monitoringRepo,
            componentsProvider,
            clock: { now: () => now },
            workerTtlMs: 120_000
        });

        const snapshotMonitoringRepo = createMonitoringSnapshotsRepo(db);
        const listMonitoringSnapshots = createListMonitoringSnapshotsUC({ snapshotsRepo: snapshotMonitoringRepo });

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
                getSnapshot: () => getSnapshot(),
                listSnapshots: async (input) => listMonitoringSnapshots(input)
            }
        });
    });

    afterAll(() => {
        cleanup();
    });

    beforeEach(async () => {
        await db.delete(accessEvents);
        await db.delete(outboxEvents);
        await db.delete(workerHeartbeats);
        await db.delete(monitoringSnapshots);
    });

    it("GET /admin/monitoring returns counts and lag markers", async () => {
        await db.insert(accessEvents).values([
            {
                id: "ae-new-old",
                deviceId: "dev-1",
                direction: "IN",
                occurredAt: older,
                idempotencyKey: "dev-1:ae-new-old",
                status: "NEW"
            },
            {
                id: "ae-new-newer",
                deviceId: "dev-1",
                direction: "OUT",
                occurredAt: newer,
                idempotencyKey: "dev-1:ae-new-newer",
                status: "NEW"
            },
            {
                id: "ae-processed",
                deviceId: "dev-1",
                direction: "IN",
                occurredAt: older,
                idempotencyKey: "dev-1:ae-processed",
                status: "PROCESSED"
            },
            {
                id: "ae-error",
                deviceId: "dev-1",
                direction: "IN",
                occurredAt: old,
                idempotencyKey: "dev-1:ae-error",
                status: "ERROR",
                lastError: "person_resolve_failed"
            },
            {
                id: "ae-failed-retry",
                deviceId: "dev-1",
                direction: "OUT",
                occurredAt: old,
                idempotencyKey: "dev-1:ae-failed-retry",
                status: "FAILED_RETRY",
                lastError: "person_resolve_failed"
            }
        ]);

        await db.insert(outboxEvents).values([
            {
                id: "ob-new-old",
                type: "audit.requested",
                payloadJson: "{}",
                status: "new",
                attempts: 0,
                createdAt: old
            },
            {
                id: "ob-new-newer",
                type: "audit.requested",
                payloadJson: "{}",
                status: "new",
                attempts: 0,
                createdAt: newer
            },
            {
                id: "ob-error",
                type: "audit.requested",
                payloadJson: "{}",
                status: "error",
                attempts: 3,
                createdAt: old,
                lastError: "telegram_send_failed"
            },
            {
                id: "ob-error-2",
                type: "audit.requested",
                payloadJson: "{}",
                status: "error",
                attempts: 2,
                createdAt: newer,
                lastError: "telegram_send_failed"
            },
            {
                id: "ob-processed",
                type: "audit.requested",
                payloadJson: "{}",
                status: "processed",
                attempts: 1,
                createdAt: older
            }
        ]);

        await db.insert(workerHeartbeats).values([
            {
                workerId: "access-events",
                updatedAt: now,
                lastStartedAt: old,
                lastSuccessAt: now,
                metaJson: JSON.stringify({ pollMs: 1000, batch: 10 })
            },
            {
                workerId: "retention",
                updatedAt: old,
                lastStartedAt: old,
                lastErrorAt: old,
                lastError: "retention_failed",
                metaJson: JSON.stringify({ mode: "run-once" })
            }
        ]);

        const res = await app.request("/api/monitoring");
        expect(res.status).toBe(200);

        const json = (await res.json()) as any;
        expect(json.success).toBe(true);

        expect(json.data.accessEvents.counts).toMatchObject({
            NEW: 2,
            PROCESSED: 1,
            ERROR: 1
        });
        expect(json.data.accessEvents.oldestUnprocessedOccurredAt).toBe(older.toISOString());

        expect(json.data.outbox.counts).toMatchObject({
            new: 2,
            error: 2,
            processed: 1
        });
        expect(json.data.outbox.oldestNewCreatedAt).toBe(old.toISOString());
        expect(json.data.now).toBe(now.toISOString());

        expect(Array.isArray(json.data.workers)).toBe(true);
        expect(json.data.workers.map((w: any) => w.workerId)).toEqual([
            "access-events",
            "retention"
        ]);
        expect(json.data.workers).toEqual([
            {
                workerId: "access-events",
                updatedAt: now.toISOString(),
                lastStartedAt: old.toISOString(),
                lastSuccessAt: now.toISOString(),
                lastErrorAt: null,
                lastError: null,
                status: "ok",
                ttlMs: 120000,
                meta: { pollMs: 1000, batch: 10 }
            },
            {
                workerId: "retention",
                updatedAt: old.toISOString(),
                lastStartedAt: old.toISOString(),
                lastSuccessAt: null,
                lastErrorAt: old.toISOString(),
                lastError: "retention_failed",
                status: "stale",
                ttlMs: 120000,
                meta: { mode: "run-once" }
            }
        ]);

        expect(json.data.topErrors.accessEvents).toEqual([
            {
                error: "person_resolve_failed",
                count: 2,
                lastAt: old.toISOString()
            }
        ]);
        expect(json.data.topErrors.outbox).toEqual([
            {
                error: "telegram_send_failed",
                count: 2,
                lastAt: newer.toISOString()
            }
        ]);
    });

    it("GET /admin/monitoring/snapshots returns stored snapshots", async () => {
        const snapshotsRepo = createMonitoringSnapshotsRepo(db);
        const snapshot: MonitoringSnapshot = {
            now,
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
                counts: { new: 2, processing: 0, processed: 1, error: 0 },
                oldestNewCreatedAt: newer
            },
            workers: [],
            topErrors: { accessEvents: [], outbox: [] },
            components: [],
            deviceService: null
        };

        snapshotsRepo.insert({
            id: "snap-1",
            createdAt: now,
            snapshot,
            outboxNewCount: snapshot.outbox.counts.new,
            outboxOldestNewAt: snapshot.outbox.oldestNewCreatedAt,
            accessOldestUnprocessedAt: snapshot.accessEvents.oldestUnprocessedOccurredAt
        });

        const res = await app.request("/api/monitoring/snapshots?limit=10");
        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.snapshots).toHaveLength(1);
        expect(json.data.snapshots[0].id).toBe("snap-1");
        expect(json.data.snapshots[0].snapshot.now).toBe(now.toISOString());
        expect(json.data.snapshots[0].snapshot.components).toEqual([]);
        expect(json.data.snapshots[0].snapshot.deviceService).toBeNull();
    });
});



