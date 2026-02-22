import type { AccessEvent, AccessEventDirection, AccessEventStatus } from "../entities/accessEvent.js";

export interface AccessEventsRepo {
    insertIdempotent(input: {
        id: string;
        deviceId: string;
        direction: AccessEventDirection;
        occurredAt: Date;
        iin?: string | null;
        terminalPersonId?: string | null;
        idempotencyKey: string;
        rawPayload?: string | null;
        status?: AccessEventStatus;
    }): Promise<"inserted" | "duplicate">;

    listDueForProcessing(input: { limit: number; now: Date }): Promise<AccessEvent[]>;
    list(input: {
        limit: number;
        offset: number;
        status?: AccessEventStatus;
        direction?: AccessEventDirection;
        deviceId?: string;
        iin?: string;
        terminalPersonId?: string;
        from?: Date;
        to?: Date;
    }): Promise<{ events: AccessEvent[]; total: number }>;
    listUnmatched(input: { limit: number }): Promise<AccessEvent[]>;
    claimBatch(input: { limit: number; now: Date; leaseMs: number; processingBy: string }): Promise<AccessEvent[]>;
    claimById(input: { id: string; now: Date; leaseMs: number; processingBy: string }): Promise<AccessEvent | null>;
    markProcessed(input: { id: string; processedAt: Date }): Promise<void>;
    markProcessedSync(input: { id: string; processedAt: Date }): void;
    markUnmatched(input: { id: string }): Promise<void>;
    markFailed(input: {
        id: string;
        error: string;
        attempts: number;
        maxAttempts: number;
        nextAttemptAt: Date;
    }): Promise<void>;
    markReadyByTerminalIdentity(input: { deviceId: string; terminalPersonId: string }): Promise<number>;

    deleteOlderThan(input: { before: Date }): Promise<number>;
    withTx(tx: unknown): AccessEventsRepo;
}

