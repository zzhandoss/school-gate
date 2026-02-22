import { createDeviceDb } from "@school-gate/device/device-db/drizzle";
import { createDeviceCursorsRepo } from "@school-gate/device/infra/drizzle/repos/deviceCursors.repo";
import { createDeviceOutboxRepo } from "@school-gate/device/infra/drizzle/repos/deviceOutbox.repo";
import { createCoreIngestHttpClient } from "@school-gate/device/infra/http/coreIngestHttpClient";
import { createProcessDeviceOutboxBatchUC } from "@school-gate/device/core/usecases/processDeviceOutboxBatch";
import { createDeviceServiceLogger } from "../logger.js";
import {
    CORE_BASE_URL,
    CORE_HMAC_SECRET,
    CORE_TOKEN,
    DEVICE_DB_FILE,
    DEVICE_OUTBOX_BATCH,
    DEVICE_OUTBOX_LEASE_MS,
    DEVICE_OUTBOX_MAX_ATTEMPTS,
    DEVICE_OUTBOX_POLL_MS,
    DEVICE_OUTBOX_PROCESSING_BY,
    DEVICE_OUTBOX_TIMEOUT_MS,
} from "./config.js";

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

const logger = createDeviceServiceLogger("device-service-outbox");

async function main() {
    const client = createDeviceDb(DEVICE_DB_FILE);
    const deviceOutboxRepo = createDeviceOutboxRepo(client.db);
    const coreIngestClient = createCoreIngestHttpClient({
        baseUrl: CORE_BASE_URL,
        token: CORE_TOKEN,
        hmacSecret: CORE_HMAC_SECRET,
        timeoutMs: DEVICE_OUTBOX_TIMEOUT_MS,
    });

    const processBatch = createProcessDeviceOutboxBatchUC({
        deviceOutboxRepo,
        coreIngestClient,
        deviceCursorsRepo: createDeviceCursorsRepo(client.db),
    });

    let stopped = false;
    const stop = () => (stopped = true);
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);

    while (!stopped) {
        try {
            const res = await processBatch({
                limit: DEVICE_OUTBOX_BATCH,
                maxAttempts: DEVICE_OUTBOX_MAX_ATTEMPTS,
                leaseMs: DEVICE_OUTBOX_LEASE_MS,
                processingBy: DEVICE_OUTBOX_PROCESSING_BY,
                now: () => new Date(),
            });

            if (res.claimed > 0) {
            logger.info(
                {
                    claimed: res.claimed,
                    processed: res.processed,
                    failed: res.failed,
                },
                "device-service outbox batch processed"
            );
            }
        } catch (e) {
            logger.error({ err: e }, "device-service outbox loop error");
        }

        await sleep(DEVICE_OUTBOX_POLL_MS);
    }

    client.close();
}

main().catch((e) => {
    logger.error({ err: e }, "device-service outbox fatal");
    process.exit(1);
});




