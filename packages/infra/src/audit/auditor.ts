import type { Auditor } from "@school-gate/core";
import { createAuditLogsService } from "@school-gate/core";
import type { Db } from "@school-gate/db";
import { createAuditLogsRepo } from "../drizzle/index.js";

export function createAuditor(db: Db): Auditor {
    return createAuditLogsService(
        { auditLogsRepo: createAuditLogsRepo(db) }
    );
}
