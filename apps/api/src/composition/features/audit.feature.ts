import { auditLogSchema, type ListAuditLogsResultDto } from "@school-gate/contracts";
import { createAuditLogsService } from "@school-gate/core";
import { createAuditLogsRepo } from "@school-gate/infra";
import type { AuditLogsModule } from "../../delivery/http/routes/auditLogs.routes.js";
import type { ApiRuntime } from "../../runtime/createRuntime.js";

export function createAuditFeature(runtime: ApiRuntime): AuditLogsModule {
    const auditLogsService = createAuditLogsService({
        auditLogsRepo: createAuditLogsRepo(runtime.dbClient.db)
    });

    return {
        list: async (input) => {
            const { from, to, ...rest } = input;
            const rows = await auditLogsService.list({
                ...rest,
                ...(from ? { from: new Date(from) } : {}),
                ...(to ? { to: new Date(to) } : {})
            });
            const data: ListAuditLogsResultDto = {
                logs: rows.logs.map((row) =>
                    auditLogSchema.parse({
                        id: row.id,
                        eventId: row.eventId,
                        actorId: row.actorId,
                        action: row.action,
                        entityType: row.entityType,
                        entityId: row.entityId,
                        meta: row.meta,
                        at: row.at.toISOString()
                    })
                ),
                page: rows.page
            };
            return data;
        }
    };
}
