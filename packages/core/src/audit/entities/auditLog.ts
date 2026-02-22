export type AuditLogRecord = {
    id: string;
    eventId: string | null;
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    meta: Record<string, unknown> | null;
    at: Date;
};

export type AuditLogEntry = {
    id: string;
    eventId?: string;
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    at: Date;
    meta?: Record<string, any>;
};
