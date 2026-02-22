import { getCoreDbFile, loadEnv } from "@school-gate/config";
import { createWorkerLogger } from "../logger.js";
import { createDb } from "@school-gate/db/drizzle";
import { removeRetentionSchedule } from "@school-gate/infra";

loadEnv();
const DB_FILE = getCoreDbFile();
const logger = createWorkerLogger("schedule-remover");

function main() {
    const client = createDb(DB_FILE);
    const clock = { now: () => new Date() };

    try {
        const result = removeRetentionSchedule(client.db, { platform: process.platform, clock });
        logger.info({ taskName: result.taskName, removed: result.removed, platform: result.platform }, "retention schedule removed");
    } finally {
        client.close();
    }
}

try {
    main();
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ err: message }, "retention schedule remove failed");
    process.exit(1);
}



