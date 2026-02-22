import { getCoreDbFile, loadEnv } from "@school-gate/config";
import { createWorkerLogger } from "../logger.js";
import { createDb } from "@school-gate/db/drizzle";
import { applyRetentionSchedule } from "@school-gate/infra";

loadEnv();
const DB_FILE = getCoreDbFile();
const logger = createWorkerLogger("schedule-applier");
function main() {
    const clock = { now: () => new Date() };
    const client = createDb(DB_FILE);
    try {
        const result = applyRetentionSchedule(client.db, { clock });
        logger.info({ taskName: result.taskName, intervalMinutes: result.intervalMinutes, platform: result.platform }, "retention schedule applied");
    } finally {
        client.close();
    }
}

try {
    main();
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ err: message }, "retention schedule apply failed");
    process.exit(1);
}


