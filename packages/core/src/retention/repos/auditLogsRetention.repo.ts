export interface AuditLogsRetentionRepo {
    deleteBefore(input: { cutoff: Date; limit: number }): Promise<number>;
    withTx(tx: unknown): AuditLogsRetentionRepo;
}

