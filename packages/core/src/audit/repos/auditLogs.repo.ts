import type { AuditLogEntry } from "../entities/auditLog.js";
import type { ListAuditLogsInput, ListAuditLogsResult } from "./auditLogs.types.js";

export interface AuditLogsRepo {
    list(input: ListAuditLogsInput): Promise<ListAuditLogsResult>;
    write(entry: AuditLogEntry): Promise<void>;
    withTx(tx: unknown): AuditLogsRepo;
}
