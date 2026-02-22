import type { AuditLogRecord } from "../entities/auditLog.js";

export type ListAuditLogsInput = {
    limit: number;
    offset: number;
    actorId?: string | undefined;
    action?: string | undefined;
    entityType?: string | undefined;
    entityId?: string | undefined;
    from?: Date | undefined;
    to?: Date | undefined;
};

export type ListAuditLogsResult = {
    logs: AuditLogRecord[];
    page: {
        limit: number;
        offset: number;
        total: number;
    };
};
