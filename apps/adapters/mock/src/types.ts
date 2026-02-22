export type AdapterAssignment = {
    deviceId: string;
    direction: "IN" | "OUT";
    lastAckedEventId?: string | null;
};

export type AdapterAccessEvent = {
    eventId: string;
    deviceId: string;
    direction: "IN" | "OUT";
    occurredAt: number;
    terminalPersonId?: string | null;
    rawPayload?: string | null;
};