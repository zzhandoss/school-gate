import type { OutboxRepo } from "../../ports/outbox.js";
import type { IdGenerator } from "../../utils/common.types.js";

export type CleanupRetentionInput = {
    now: Date;
    batch: number;
    accessEventsDays: number;
    auditLogsDays: number;
};

export type CleanupRetentionResult = {
    accessEventsDeleted: number;
    auditLogsDeleted: number;
    accessEventsCutoff: Date;
    auditLogsCutoff: Date;
};

export type CleanupRetentionAudit = {
    outbox: OutboxRepo;
    idGen: IdGenerator;
    actorId?: string | undefined;
};