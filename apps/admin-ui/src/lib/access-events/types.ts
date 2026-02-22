export type AccessEventStatus = "NEW" | "PROCESSING" | "PROCESSED" | "FAILED_RETRY" | "UNMATCHED" | "ERROR";

export type AccessEventItem = {
    id: string
    deviceId: string
    direction: "IN" | "OUT"
    occurredAt: string
    terminalPersonId: string | null
    iin: string | null
    status: AccessEventStatus
    attempts: number
    lastError: string | null
    person: {
        id: string
        iin: string
        firstName: string | null
        lastName: string | null
    } | null
    processedAt: string | null
    createdAt: string
};

export type UnmatchedAccessEventItem = AccessEventItem & {
    status: "UNMATCHED"
};

export type ListAccessEventsInput = {
    limit: number
    offset: number
    status?: AccessEventStatus
    direction?: "IN" | "OUT"
    deviceId?: string
    iin?: string
    terminalPersonId?: string
    from?: string
    to?: string
};

export type ListAccessEventsResult = {
    events: Array<AccessEventItem>
    page: {
        limit: number
        offset: number
        total: number
    }
};

export type PersonLookupItem = {
    id: string
    iin: string
    terminalPersonId: string | null
    firstName: string | null
    lastName: string | null
    createdAt: string
};

export type MapTerminalIdentityInput = {
    personId: string
    deviceId: string
    terminalPersonId: string
};

export type MapTerminalIdentityResult = {
    status: "linked" | "already_linked"
    updatedEvents: number
};

export type PersonDeviceIdentity = {
    id: string
    personId: string
    deviceId: string
    terminalPersonId: string
    createdAt: string
};
