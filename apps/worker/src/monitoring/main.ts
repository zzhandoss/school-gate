import crypto from "node:crypto";
import { createDb } from "@school-gate/db/drizzle";
import {
    getBotClientConfig,
    getCoreDbFile,
    getMonitoringConfig,
    getMonitoringOpsConfig,
    loadEnv,
} from "@school-gate/config";
import {
    createCaptureMonitoringSnapshotFlow,
    createMonitoringService,
    createMonitoringSnapshotsService
} from "@school-gate/core";
import { createMonitoringRepo } from "@school-gate/infra";
import { createMonitoringSnapshotsRepo } from "@school-gate/infra";
import { createAlertEventsRepo } from "@school-gate/infra";
import { createAlertRulesRepo } from "@school-gate/infra";
import { createAlertSubscriptionsRepo } from "@school-gate/infra";
import { createWorkerHeartbeatsRepo } from "@school-gate/infra";
import { createOutbox } from "@school-gate/infra";
import {
    createDeviceServiceMonitoringHttpClient,
    createMonitoringComponentsProvider,
} from "@school-gate/infra";
import { createUnitOfWork } from "@school-gate/infra";
import { createHeartbeatWriter } from "../heartbeat.js";
import { createWorkerLogger } from "../logger.js";
import { loadRuntimeSettings } from "../runtimeSettings.js";
import { processMonitoringAlerts } from "./processMonitoringAlerts.js";

loadEnv();
const DB_FILE = getCoreDbFile();
const logger = createWorkerLogger("worker-monitoring");

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

async function main() {
    const client = createDb(DB_FILE);
    const clock = { now: () => new Date() };
    const idGen = { nextId: () => crypto.randomUUID() };

    const runtimeSettings = loadRuntimeSettings(client.db, clock);
    const monitoringCfg = getMonitoringConfig(runtimeSettings.monitoring);
    const opsCfg = getMonitoringOpsConfig();
    const botClientCfg = getBotClientConfig();

    const apiBaseUrl = opsCfg.apiUrl.replace(/\/$/, "");
    const deviceServiceBaseUrl = opsCfg.deviceServiceUrl.replace(/\/$/, "");
    const botBaseUrl = opsCfg.botUrl.replace(/\/$/, "");

    const componentsProvider = createMonitoringComponentsProvider({
        httpTargets: [
            { componentId: "api", url: `${apiBaseUrl}/health`, timeoutMs: opsCfg.httpTimeoutMs },
            {
                componentId: "device-service",
                url: `${deviceServiceBaseUrl}/health`,
                timeoutMs: opsCfg.httpTimeoutMs,
            },
            {
                componentId: "bot",
                url: `${botBaseUrl}/api/health`,
                timeoutMs: opsCfg.httpTimeoutMs,
                headers: { authorization: `Bearer ${botClientCfg.internalToken}` },
            },
        ],
        deviceServiceClient: createDeviceServiceMonitoringHttpClient({
            baseUrl: opsCfg.deviceServiceUrl,
            token: opsCfg.deviceServiceToken,
            timeoutMs: opsCfg.httpTimeoutMs,
        }),
        clock: clock.now,
    });

    const monitoringService = createMonitoringService({
        monitoringRepo: createMonitoringRepo(client.db),
        componentsProvider,
        clock,
        workerTtlMs: monitoringCfg.workerTtlMs,
    });

    const snapshotsRepo = createMonitoringSnapshotsRepo(client.db);
    const monitoringSnapshotService = createMonitoringSnapshotsService({
        snapshotsRepo
    });

    const captureSnapshot = createCaptureMonitoringSnapshotFlow({
        monitoringService,
        snapshotsService: monitoringSnapshotService,
        idGen: { nextId: () => crypto.randomUUID() },
    });

    const processAlerts = processMonitoringAlerts(client.db, idGen, clock);

    const heartbeat = createHeartbeatWriter({
        repo: createWorkerHeartbeatsRepo(client.db),
        workerId: "monitoring",
        clock,
        baseMeta: {
            intervalMs: opsCfg.snapshotIntervalMs,
            retentionDays: opsCfg.snapshotRetentionDays,
        },
    });
    heartbeat.onStart();

    let stopped = false;
    const stop = () => {
        stopped = true;
    };
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);

    while (!stopped) {
        try {
            const record = await captureSnapshot();
            const retentionMs = opsCfg.snapshotRetentionDays * 24 * 60 * 60 * 1000;
            const deleted = monitoringSnapshotService.deleteOlderThan({
                before: new Date(record.createdAt.getTime() - retentionMs),
            });
            const recent = snapshotsRepo.list({ limit: 2 });
            const previous = recent.find((entry) => entry.id !== record.id);
            const alertsResult = await processAlerts({
                snapshot: record,
                previousSnapshot: previous,
            });
            heartbeat.onSuccess({ snapshotId: record.id, deleted, alerts: alertsResult });
            logger.info(
                { snapshotId: record.id, deleted, alerts: alertsResult },
                "monitoring snapshot captured"
            );
        } catch (e) {
            heartbeat.onError(e);
            logger.error({ err: e }, "monitoring loop error");
        }

        await sleep(opsCfg.snapshotIntervalMs);
    }

    client.close();
}

main().catch((e) => {
    logger.error({ err: e }, "monitoring fatal");
    process.exit(1);
});
