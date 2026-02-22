export type AuditLogItem = {
    id: string
    eventId: string | null
    actorId: string
    action: string
    entityType: string
    entityId: string
    meta: Record<string, unknown> | null
    at: string
};

export type ListAuditLogsInput = {
    limit: number
    offset: number
    actorId?: string
    action?: string
    entityType?: string
    entityId?: string
    from?: string
    to?: string
};

export type ListAuditLogsResult = {
    logs: Array<AuditLogItem>
    page: {
        limit: number
        offset: number
        total: number
    }
};
