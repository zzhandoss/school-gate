import { getCoreDbFile, loadEnv } from "@school-gate/config";
import { createWorkerLogger } from "../logger.js";
import { createDb } from "@school-gate/db/drizzle";
import { runRetentionOnce } from "@school-gate/infra";

loadEnv();
const DB_FILE = getCoreDbFile();
const logger = createWorkerLogger("retention-worker");
async function runOnce() {
    const clock = { now: () => new Date() };

    const client = createDb(DB_FILE);
    try {
        const result = await runRetentionOnce(client.db, clock);
        logger.info({ accessEventsDeleted: result.accessEventsDeleted, auditLogsDeleted: result.auditLogsDeleted }, "retention run-once completed");
    } finally {
        client.close();
    }
}

runOnce().catch((error) => {
    logger.error({ err: error }, "retention run-once fatal");
    process.exit(1);
});



