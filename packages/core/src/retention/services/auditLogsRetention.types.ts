import type { AuditLogsRetentionRepo } from "../repos/auditLogsRetention.repo.js";

export type AuditLogsRetentionService = {
    deleteBefore(input: { cutoff: Date; limit: number }): Promise<number>;
    withTx(tx: unknown): AuditLogsRetentionService;
};

export type AuditLogsRetentionServiceDeps = {
    auditLogsRetentionRepo: AuditLogsRetentionRepo;
};

