import { Auditor, createAuditLogsService } from "@school-gate/core";
import { Db } from "@school-gate/db";
import { createAuditLogsRepo } from "../drizzle/index.js";

export function createAuditor(db: Db): Auditor {
    return createAuditLogsService(
        { auditLogsRepo: createAuditLogsRepo(db) }
    );
}
