export interface AccessEventsRetentionRepo {
    deleteTerminalBefore(input: { cutoff: Date; limit: number }): Promise<number>;
    withTx(tx: unknown): AccessEventsRetentionRepo;
}

