import crypto from "node:crypto";
import { getCoreDbFile, loadEnv } from "@school-gate/config";
import { createWorkerLogger } from "../logger.js";

import { createAccessEventsConfig } from "./config.js";
import { createDb } from "@school-gate/db/drizzle";
import { createUnitOfWork } from "@school-gate/infra";
import { createOutbox } from "@school-gate/infra";
import { createAccessEventsRepo } from "@school-gate/infra";
import { createAccessEventsService, createProcessAccessEventsUC } from "@school-gate/core";
import { createPersonsRepo } from "@school-gate/infra";
import { createWorkerHeartbeatsRepo } from "@school-gate/infra";
import {
    createPersonTerminalIdentitiesRepo
} from "@school-gate/infra";
import { createSubscriptionsRepo } from "@school-gate/infra";
import { createHeartbeatWriter } from "../heartbeat.js";
import { loadRuntimeSettings } from "../runtimeSettings.js";

loadEnv();
const DB_FILE = getCoreDbFile();
const logger = createWorkerLogger("worker-access-events");

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

async function main() {
    const client = createDb(DB_FILE);
    const clock = { now: () => new Date() };
    const runtimeSettings = loadRuntimeSettings(client.db, clock);
    const accessCfg = createAccessEventsConfig(runtimeSettings.accessEvents);
    const heartbeat = createHeartbeatWriter({
        repo: createWorkerHeartbeatsRepo(client.db),
        workerId: "access-events",
        clock,
        baseMeta: { pollMs: accessCfg.pollMs, batch: accessCfg.batch },
    });
    heartbeat.onStart();

    const accessEventsService = createAccessEventsService({ accessEventsRepo: createAccessEventsRepo(client.db) });

    const tx = createUnitOfWork(client.db, {
        accessEventsService: (db) => accessEventsService.withTx(db),
        outbox: createOutbox,
    });

    const uc = createProcessAccessEventsUC({
        accessEventsService: accessEventsService,
        personsRepo: createPersonsRepo(client.db),
        personTerminalIdentitiesRepo: createPersonTerminalIdentitiesRepo(client.db),
        subscriptionsRepo: createSubscriptionsRepo(client.db),
        tx,
        idGen: { nextId: () => crypto.randomUUID() },
        clock,
    });

    let stopped = false;
    const stop = () => (stopped = true);
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);

    while (!stopped) {
        try {
            const res = await uc({
                limit: accessCfg.batch,
                retryDelayMs: accessCfg.retryDelayMs,
                leaseMs: accessCfg.leaseMs,
                processingBy: accessCfg.processingBy,
                maxAttempts: accessCfg.maxAttempts,
            });
            heartbeat.onSuccess({
                processed: res.processed,
                unmatched: res.unmatched,
                failed: res.failed,
                notifications: res.notifications,
            });

            if (res.processed + res.unmatched + res.failed > 0) {
                logger.info(
                    {
                        processed: res.processed,
                        unmatched: res.unmatched,
                        failed: res.failed,
                        notifications: res.notifications,
                    },
                    "access-events batch processed"
                );
            }
        } catch (e) {
            heartbeat.onError(e);
            logger.error({ err: e }, "access-events loop error");
        }

        await sleep(accessCfg.pollMs);
    }

    client.close();
}

main().catch((e) => {
    logger.error({ err: e }, "access-events fatal");
    process.exit(1);
});



