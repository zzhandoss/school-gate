export type AccessEventAdminView = {
    id: string;
    deviceId: string;
    direction: "IN" | "OUT";
    occurredAt: Date;
    terminalPersonId: string | null;
    iin: string | null;
    status: "NEW" | "PROCESSING" | "PROCESSED" | "FAILED_RETRY" | "UNMATCHED" | "ERROR";
    attempts: number;
    lastError: string | null;
    processedAt: Date | null;
    createdAt: Date;
    person: {
        id: string;
        iin: string;
        firstName: string | null;
        lastName: string | null;
    } | null;
};
