import crypto from "node:crypto";
import { createDb } from "@school-gate/db/drizzle";
import { processOutboxBatch } from "./processOutboxBatch.js";
import { outboxHandlers } from "./handlers/index.js";
import { createOutboxConfig } from "./config.js";
import { createBotNotificationSender } from "./notificationSender.js";
import { createBotHttpClient } from "./botClient.js";
import { getBotClientConfig, getCoreDbFile, getNotificationsConfig, loadEnv } from "@school-gate/config";
import { createWorkerLogger } from "../logger.js";
import { createWorkerHeartbeatsRepo } from "@school-gate/infra";
import { createHeartbeatWriter } from "../heartbeat.js";
import { loadRuntimeSettings } from "../runtimeSettings.js";

loadEnv();
const DB_FILE = getCoreDbFile();
const logger = createWorkerLogger("worker-outbox");

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

async function main() {
    const client = createDb(DB_FILE);
    const clock = { now: () => new Date() };
    const runtimeSettings = loadRuntimeSettings(client.db, clock);
    const outboxCfg = createOutboxConfig(runtimeSettings.outbox);
    const notificationsCfg = getNotificationsConfig(runtimeSettings.notifications);
    const botCfg = getBotClientConfig();
    const pollMs = outboxCfg.pollMs;
    const batch = outboxCfg.batch;
    const maxAttempts = outboxCfg.maxAttempts;
    const botClient = createBotHttpClient({ baseUrl: botCfg.baseUrl, token: botCfg.internalToken });
    const notificationSender = createBotNotificationSender({
        botClient,
        template: { parentTemplate: notificationsCfg.parentTemplate }
    });
    const heartbeat = createHeartbeatWriter({
        repo: createWorkerHeartbeatsRepo(client.db),
        workerId: "outbox",
        clock,
        baseMeta: { pollMs, batch, maxAttempts }
    });
    heartbeat.onStart();

    let stopped = false;
    const stop = () => (stopped = true);
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);

    let lastBotHealthy: boolean | undefined;
    while (!stopped) {
        try {
            const botHealthy = await botClient.isHealthy();
            if (!botHealthy) {
                if (lastBotHealthy !== false) {
                    logger.warn("outbox bot unavailable, skipping claims");
                }
                lastBotHealthy = false;
                heartbeat.onSuccess({ claimed: 0, processed: 0, failed: 0 });
                await sleep(pollMs);
                continue;
            }

            if (lastBotHealthy === false) {
                logger.info("outbox bot is healthy, resuming");
            }
            lastBotHealthy = true;

            const res = await processOutboxBatch(client.db, {
                limit: batch,
                maxAttempts: maxAttempts,
                leaseMs: outboxCfg.leaseMs,
                processingBy: outboxCfg.processingBy,
                now: clock.now,
                newId: crypto.randomUUID,
                handlers: outboxHandlers,
                notificationSender,
                notificationFreshness: {
                    parentMaxAgeMs: notificationsCfg.parentMaxAgeMs,
                    alertMaxAgeMs: notificationsCfg.alertMaxAgeMs
                }
            });
            heartbeat.onSuccess({
                claimed: res.claimed,
                processed: res.processed,
                failed: res.failed
            });

            if (res.claimed > 0) {
                logger.info(
                    {
                        claimed: res.claimed,
                        processed: res.processed,
                        failed: res.failed
                    },
                    "outbox batch processed"
                );
            }
        } catch (e) {
            heartbeat.onError(e);
            logger.error({ err: e }, "outbox loop error");
        }

        await sleep(pollMs);
    }

    client.close();
}

main().catch((e) => {
    logger.error({ err: e }, "outbox fatal");
    process.exit(1);
});


