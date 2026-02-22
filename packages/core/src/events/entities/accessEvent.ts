export type AccessEventStatus = "NEW" | "PROCESSING" | "PROCESSED" | "FAILED_RETRY" | "UNMATCHED" | "ERROR";
export type AccessEventDirection = "IN" | "OUT";

export type AccessEvent = {
    id: string;
    deviceId: string;
    direction: AccessEventDirection;
    occurredAt: Date;
    iin: string | null;
    terminalPersonId: string | null;
    idempotencyKey: string;
    rawPayload: string | null;
    status: AccessEventStatus;
    attempts: number;
    nextAttemptAt: Date | null;
    processedAt: Date | null;
    createdAt: Date;
};
