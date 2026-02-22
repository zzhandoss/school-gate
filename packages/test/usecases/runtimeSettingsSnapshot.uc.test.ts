import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { settings as settingsTable } from "@school-gate/db/schema/index";
import { createSettingsRepo } from "@school-gate/infra/drizzle/repos/settings.repo";
import { createSettingsService } from "@school-gate/core";
import { createRuntimeConfigProvider } from "@school-gate/infra/config/runtimeConfigProvider";

describe("Runtime settings snapshot", () => {
    let db: ReturnType<typeof createTestDb>["db"];
    let cleanup: () => void;
    const prevEnv = {
        WORKER_POLL_MS: process.env.WORKER_POLL_MS,
        WORKER_BATCH: process.env.WORKER_BATCH,
        FEATURE_AUTO_RESOLVE_PERSON: process.env.FEATURE_AUTO_RESOLVE_PERSON,
        RETENTION_POLL_MS: process.env.RETENTION_POLL_MS,
        RETENTION_BATCH: process.env.RETENTION_BATCH,
        RETENTION_ACCESS_EVENTS_DAYS: process.env.RETENTION_ACCESS_EVENTS_DAYS,
        RETENTION_AUDIT_LOGS_DAYS: process.env.RETENTION_AUDIT_LOGS_DAYS,
        MONITORING_WORKER_TTL_MS: process.env.MONITORING_WORKER_TTL_MS,
        NOTIFICATIONS_PARENT_TEMPLATE: process.env.NOTIFICATIONS_PARENT_TEMPLATE,
        NOTIFICATIONS_PARENT_MAX_AGE_MS: process.env.NOTIFICATIONS_PARENT_MAX_AGE_MS,
        NOTIFICATIONS_ALERT_MAX_AGE_MS: process.env.NOTIFICATIONS_ALERT_MAX_AGE_MS,
    };

    beforeAll(() => {
        process.env.WORKER_POLL_MS = "3000";
        process.env.WORKER_BATCH = "20";
        process.env.FEATURE_AUTO_RESOLVE_PERSON = "false";
        process.env.RETENTION_POLL_MS = "300000";
        process.env.RETENTION_BATCH = "500";
        process.env.RETENTION_ACCESS_EVENTS_DAYS = "30";
        process.env.RETENTION_AUDIT_LOGS_DAYS = "30";
        process.env.MONITORING_WORKER_TTL_MS = "120000";
        process.env.NOTIFICATIONS_PARENT_TEMPLATE = "Hello {{firstName}}";
        process.env.NOTIFICATIONS_PARENT_MAX_AGE_MS = "600000";
        process.env.NOTIFICATIONS_ALERT_MAX_AGE_MS = "300000";

        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;
    });

    afterAll(() => {
        process.env.WORKER_POLL_MS = prevEnv.WORKER_POLL_MS;
        process.env.WORKER_BATCH = prevEnv.WORKER_BATCH;
        process.env.FEATURE_AUTO_RESOLVE_PERSON = prevEnv.FEATURE_AUTO_RESOLVE_PERSON;
        process.env.RETENTION_POLL_MS = prevEnv.RETENTION_POLL_MS;
        process.env.RETENTION_BATCH = prevEnv.RETENTION_BATCH;
        process.env.RETENTION_ACCESS_EVENTS_DAYS = prevEnv.RETENTION_ACCESS_EVENTS_DAYS;
        process.env.RETENTION_AUDIT_LOGS_DAYS = prevEnv.RETENTION_AUDIT_LOGS_DAYS;
        process.env.MONITORING_WORKER_TTL_MS = prevEnv.MONITORING_WORKER_TTL_MS;
        process.env.NOTIFICATIONS_PARENT_TEMPLATE = prevEnv.NOTIFICATIONS_PARENT_TEMPLATE;
        process.env.NOTIFICATIONS_PARENT_MAX_AGE_MS = prevEnv.NOTIFICATIONS_PARENT_MAX_AGE_MS;
        process.env.NOTIFICATIONS_ALERT_MAX_AGE_MS = prevEnv.NOTIFICATIONS_ALERT_MAX_AGE_MS;
        cleanup();
    });

    beforeEach(async () => {
        await db.delete(settingsTable);
    });

    it("returns env, db override and effective values", () => {
        const settingsRepo = createSettingsRepo(db);
        const runtimeConfigProvider = createRuntimeConfigProvider();
        const settingsService = createSettingsService({
            settingsRepo,
            runtimeConfigProvider,
            clock: { now: () => new Date("2026-01-27T12:30:00.000Z") },
        });

        settingsService.setRuntimeSettings({
            worker: { pollMs: 1111 },
            outbox: { batch: 9 },
            accessEvents: { leaseMs: 45_000 },
            retention: { accessEventsDays: 10 },
            monitoring: { workerTtlMs: 240_000 },
            notifications: { parentTemplate: "Hi {{lastName}}", parentMaxAgeMs: 660_000, alertMaxAgeMs: 360_000 },
        });

        const snapshot = settingsService.listRuntimeSettingsSnapshot();

        expect(snapshot.worker.pollMs.db).toBe(1111);
        expect(snapshot.worker.pollMs.effective).toBe(1111);
        expect(snapshot.worker.pollMs.updatedAt).toBeInstanceOf(Date);

        expect(snapshot.worker.batch.db).toBeUndefined();
        expect(snapshot.worker.batch.effective).toBe(snapshot.worker.batch.env);

        expect(snapshot.outbox.batch.db).toBe(9);
        expect(snapshot.outbox.batch.effective).toBe(9);

        expect(snapshot.accessEvents.leaseMs.db).toBe(45_000);
        expect(snapshot.accessEvents.leaseMs.effective).toBe(45_000);

        expect(snapshot.retention.accessEventsDays.db).toBe(10);
        expect(snapshot.retention.accessEventsDays.effective).toBe(10);

        expect(snapshot.monitoring.workerTtlMs.db).toBe(240_000);
        expect(snapshot.monitoring.workerTtlMs.effective).toBe(240_000);

        expect(snapshot.notifications.parentTemplate.db).toBe("Hi {{lastName}}");
        expect(snapshot.notifications.parentTemplate.effective).toBe("Hi {{lastName}}");
        expect(snapshot.notifications.parentMaxAgeMs.db).toBe(660_000);
        expect(snapshot.notifications.parentMaxAgeMs.effective).toBe(660_000);
        expect(snapshot.notifications.alertMaxAgeMs.db).toBe(360_000);
        expect(snapshot.notifications.alertMaxAgeMs.effective).toBe(360_000);
    });
});

