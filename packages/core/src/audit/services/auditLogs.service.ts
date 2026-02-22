import type { AuditLogsService, AuditLogsServiceDeps } from "./auditLogs.types.js";
import type { AuditLogEntry } from "../entities/auditLog.js";

export function createAuditLogsService(deps: AuditLogsServiceDeps): AuditLogsService {
    return {
        withTx(tx: unknown) {
            return createAuditLogsService({
                ...deps,
                auditLogsRepo: deps.auditLogsRepo.withTx(tx)
            });
        },



        list(input) {
            return deps.auditLogsRepo.list(input);
        },
        write(input: AuditLogEntry): Promise<void> {
            return deps.auditLogsRepo.write(input);
        }
    };
}


