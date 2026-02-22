import type { DomainEvent } from "../events/domain.js";

export type OutboxRecord = {
    id: string;
    type: string;
    payloadJson: string;
    attempts: number;
};

export interface OutboxRepo {
    enqueue(input: { id: string; event: DomainEvent }): void;
    claimBatch(input: { limit: number; now: Date; leaseMs: number; processingBy: string }): OutboxRecord[];
    markProcessed(input: { id: string; processedAt: Date }): void;
    markFailed(input: { id: string; error: string; maxAttempts: number }): void;
}

export type Outbox = OutboxRepo;
