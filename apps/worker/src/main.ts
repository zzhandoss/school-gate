import crypto from "node:crypto";
import { createDb, type Db } from "@school-gate/db/drizzle";
import {
    type Clock,
    createPersonsService, createPersonTerminalIdentitiesService,
    createPreprocessPendingRequestsUC,
    createSubscriptionRequestsService, type FeatureFlags, type IdGenerator, type PersonResolver
} from "@school-gate/core";
import { createSubscriptionRequestsRepo } from "@school-gate/infra";
import { createPersonsRepo } from "@school-gate/infra";
import { createPersonTerminalIdentitiesRepo } from "@school-gate/infra";
import { createWorkerHeartbeatsRepo } from "@school-gate/infra";
import { getCoreDbFile, getMonitoringOpsConfig, getWorkerConfig, loadEnv } from "@school-gate/config";
import { createDeviceServicePersonResolver } from "@school-gate/device/infra/http/personResolver";
import { createHeartbeatWriter } from "./heartbeat.js";
import { createWorkerLogger } from "./logger.js";
import { loadRuntimeSettings } from "./runtimeSettings.js";

loadEnv();
const DB_FILE = getCoreDbFile();
const logger = createWorkerLogger("worker-preprocess");

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

const idGen = {
    nextId: () => crypto.randomUUID()
};

const clock = {
    now: () => new Date()
};

const createPreprocessPendingRequests = (
    db: Db,
    flags: FeatureFlags,
    idGen: IdGenerator,
    clock: Clock,
    personResolver: PersonResolver
) => {
    const subscriptionRequestRepo = createSubscriptionRequestsRepo(db);
    const personsRepo = createPersonsRepo(db);
    const personTerminalIdentitiesRepo = createPersonTerminalIdentitiesRepo(db);
    const subscriptionRequestsService =
        createSubscriptionRequestsService({ subscriptionRequestsRepo: subscriptionRequestRepo });
    const personsService =
        createPersonsService({ personsRepo });
    const personIdentitiesService =
        createPersonTerminalIdentitiesService({ personTerminalIdentitiesRepo });

    return createPreprocessPendingRequestsUC({
        subscriptionRequestsService: subscriptionRequestsService,
        personsService: personsService,
        personTerminalIdentitiesService: personIdentitiesService,
        personResolver,
        flags: flags,
        idGen: idGen,
        clock: clock
    });
};

async function main() {
    const client = createDb(DB_FILE);
    const runtimeSettings = loadRuntimeSettings(client.db, clock);
    const workerConfig = getWorkerConfig(runtimeSettings.worker);
    const monitoringOpsConfig = getMonitoringOpsConfig();
    const personResolver = createDeviceServicePersonResolver({
        baseUrl: monitoringOpsConfig.deviceServiceUrl,
        token: monitoringOpsConfig.deviceServiceToken,
        timeoutMs: monitoringOpsConfig.httpTimeoutMs
    });
    const flags = {
        autoResolvePersonByIin: workerConfig.autoResolvePersonByIin
    };
    const pollMs = workerConfig.pollMs;
    const batch = workerConfig.batch;
    const heartbeat = createHeartbeatWriter({
        repo: createWorkerHeartbeatsRepo(client.db),
        workerId: "preprocess",
        clock,
        baseMeta: { pollMs, batch }
    });
    heartbeat.onStart();

    const uc = createPreprocessPendingRequests(client.db, flags, idGen, clock, personResolver);

    // graceful shutdown
    let stopped = false;
    const stop = () => {
        stopped = true;
    };
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);

    while (!stopped) {
        try {
            const res = await uc({ limit: batch });
            heartbeat.onSuccess({
                processed: res.processed,
                ready: res.ready,
                needsPerson: res.needsPerson,
                errors: res.errors
            });
            if (res.processed > 0) {
                logger.info(
                    {
                        processed: res.processed,
                        ready: res.ready,
                        needsPerson: res.needsPerson,
                        errors: res.errors
                    },
                    "worker batch processed"
                );
            }
        } catch (e) {
            heartbeat.onError(e);
            logger.error({ err: e }, "worker loop error");
        }

        await sleep(pollMs);
    }

    client.close();
}

main().catch((e) => {
    logger.error({ err: e }, "worker fatal");
    process.exit(1);
});










