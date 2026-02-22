import type { AuditLogEntry } from "../entities/auditLog.js";
import type { ListAuditLogsInput, ListAuditLogsResult } from "../repos/auditLogs.types.js";
import type { AuditLogsRepo } from "../repos/auditLogs.repo.js";

export type AuditLogsService = {
    list(input: ListAuditLogsInput): Promise<ListAuditLogsResult>;
    write(input: AuditLogEntry): Promise<void>;
    withTx(tx: unknown): AuditLogsService;
};

export type AuditLogsServiceDeps = {
    auditLogsRepo: AuditLogsRepo;
};
