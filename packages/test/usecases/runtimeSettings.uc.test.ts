import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { settings as settingsTable } from "@school-gate/db/schema/index";
import { createSettingsRepo } from "@school-gate/infra/drizzle/repos/settings.repo";
import { InvalidSettingValueError, createSettingsService } from "@school-gate/core";
import {
    getAccessEventsWorkerConfig,
    getMonitoringConfig,
    getNotificationsConfig,
    getOutboxWorkerConfig,
    getWorkerConfig
} from "@school-gate/config";

describe("Runtime settings", () => {
    let db: ReturnType<typeof createTestDb>["db"];
    let cleanup: () => void;

    beforeAll(() => {
        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;
    });

    afterAll(() => cleanup());

    beforeEach(async () => {
        await db.delete(settingsTable);
    });

    it("overrides env defaults with DB settings", () => {
        const settingsRepo = createSettingsRepo(db);
        const settingsService = createSettingsService({
            settingsRepo,
            runtimeConfigProvider: undefined as never,
            clock: { now: () => new Date("2026-01-27T12:00:00.000Z") }
        });

        settingsService.setRuntimeSettings({
            worker: { pollMs: 1234, autoResolvePersonByIin: true },
            outbox: { batch: 7, maxAttempts: 3 },
            accessEvents: { leaseMs: 45_000, processingBy: "test-worker" },
            monitoring: { workerTtlMs: 180000 },
            notifications: { parentTemplate: "Hi {{firstName}}", parentMaxAgeMs: 700_000, alertMaxAgeMs: 400_000 }
        });

        const runtime = settingsService.getRuntimeSettings();

        const workerCfg = getWorkerConfig(runtime.worker);
        expect(workerCfg.pollMs).toBe(1234);
        expect(workerCfg.autoResolvePersonByIin).toBe(true);

        const outboxCfg = getOutboxWorkerConfig(runtime.outbox);
        expect(outboxCfg.batch).toBe(7);
        expect(outboxCfg.maxAttempts).toBe(3);

        const accessCfg = getAccessEventsWorkerConfig(runtime.accessEvents);
        expect(accessCfg.leaseMs).toBe(45_000);
        expect(accessCfg.processingBy).toBe("test-worker");

        const monitoringCfg = getMonitoringConfig(runtime.monitoring);
        expect(monitoringCfg.workerTtlMs).toBe(180000);

        const notificationsCfg = getNotificationsConfig(runtime.notifications);
        expect(notificationsCfg.parentTemplate).toBe("Hi {{firstName}}");
        expect(notificationsCfg.parentMaxAgeMs).toBe(700_000);
        expect(notificationsCfg.alertMaxAgeMs).toBe(400_000);
    });

    it("throws InvalidSettingValueError on invalid input", () => {
        const settingsRepo = createSettingsRepo(db);
        const settingsService = createSettingsService({
            settingsRepo,
            runtimeConfigProvider: undefined as never,
            clock: { now: () => new Date("2026-01-27T12:00:00.000Z") }
        });

        expect(() => {
            settingsService.setRuntimeSettings({ worker: { pollMs: -1 } });
        }).toThrowError(InvalidSettingValueError);
    });
});

