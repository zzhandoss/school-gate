import type { AccessEventsRetentionRepo } from "../repos/accessEventsRetention.repo.js";

export type AccessEventsRetentionService = {
    deleteTerminalBefore(input: { cutoff: Date; limit: number }): Promise<number>;
    withTx(tx: unknown): AccessEventsRetentionService;
};

export type AccessEventsRetentionServiceDeps = {
    accessEventsRetentionRepo: AccessEventsRetentionRepo;
};

