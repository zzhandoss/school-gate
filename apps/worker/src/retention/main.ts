import { getCoreDbFile, loadEnv } from "@school-gate/config";
import crypto from "node:crypto";
import { createWorkerLogger } from "../logger.js";
import { createDb } from "@school-gate/db/drizzle";
import {
    createAccessEventsRetentionService,
    createAuditLogsRetentionService,
    createCleanupRetentionFlow
} from "@school-gate/core";
import { createAccessEventsRetentionRepo } from "@school-gate/infra";
import { createAuditLogsRetentionRepo } from "@school-gate/infra";
import { createOutbox } from "@school-gate/infra";
import { createWorkerHeartbeatsRepo } from "@school-gate/infra";
import { loadRuntimeSettings } from "../runtimeSettings.js";
import { createHeartbeatWriter } from "../heartbeat.js";
import { createRetentionConfig } from "./config.js";

loadEnv();
const DB_FILE = getCoreDbFile();
const logger = createWorkerLogger("worker-retention");

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    const client = createDb(DB_FILE);
    const clock = { now: () => new Date() };
    const idGen = { nextId: () => crypto.randomUUID() };

    const runtimeSettings = loadRuntimeSettings(client.db, clock);
    const retentionCfg = createRetentionConfig(runtimeSettings.retention);

    const accessEventsRetentionService = createAccessEventsRetentionService(
        { accessEventsRetentionRepo: createAccessEventsRetentionRepo(client.db) }
    );
    const auditLogsRetentionService = createAuditLogsRetentionService(
        { auditLogsRetentionRepo: createAuditLogsRetentionRepo(client.db) }
    );

    const cleanupRetention = createCleanupRetentionFlow({
        accessEventsRetentionService: accessEventsRetentionService,
        auditLogsRetentionService: auditLogsRetentionService,
        audit: {
            outbox: createOutbox(client.db),
            idGen,
            actorId: "system:retention_worker"
        }
    });
    const heartbeat = createHeartbeatWriter({
        repo: createWorkerHeartbeatsRepo(client.db),
        workerId: "retention",
        clock,
        baseMeta: {
            pollMs: retentionCfg.pollMs,
            batch: retentionCfg.batch,
            accessEventsDays: retentionCfg.accessEventsDays,
            auditLogsDays: retentionCfg.auditLogsDays,
            mode: "worker"
        }
    });
    heartbeat.onStart();

    let stopped = false;
    const stop = () => (stopped = true);
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);

    while (!stopped) {
        try {
            const startedAt = clock.now();
            const result = await cleanupRetention({
                now: startedAt,
                batch: retentionCfg.batch,
                accessEventsDays: retentionCfg.accessEventsDays,
                auditLogsDays: retentionCfg.auditLogsDays
            });
            heartbeat.onSuccess({
                accessEventsDeleted: result.accessEventsDeleted,
                auditLogsDeleted: result.auditLogsDeleted
            });

            if (result.accessEventsDeleted + result.auditLogsDeleted > 0) {
                logger.info(
                    {
                        accessEventsDeleted: result.accessEventsDeleted,
                        auditLogsDeleted: result.auditLogsDeleted
                    },
                    "retention batch processed"
                );
            }
        } catch (error) {
            heartbeat.onError(error);
            logger.error({ err: error }, "retention loop error");
        }

        await sleep(retentionCfg.pollMs);
    }

    client.close();
}

main().catch((error) => {
    logger.error({ err: error }, "retention fatal");
    process.exit(1);
});


