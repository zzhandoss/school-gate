import type { AccessEventAdminView } from "../models/index.js";

export type ListAccessEventsAdminInput = {
    limit: number;
    offset: number;
    status?: "NEW" | "PROCESSING" | "PROCESSED" | "FAILED_RETRY" | "UNMATCHED" | "ERROR" | undefined;
    direction?: "IN" | "OUT" | undefined;
    deviceId?: string | undefined;
    iin?: string | undefined;
    terminalPersonId?: string | undefined;
    from?: Date | undefined;
    to?: Date | undefined;
};

export type AccessEventsAdminQueryPort = {
    list(input: ListAccessEventsAdminInput): Promise<{ events: AccessEventAdminView[]; total: number }>;
};
