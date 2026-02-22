import type {
    AuditLogsRetentionService,
    AuditLogsRetentionServiceDeps
} from "./auditLogsRetention.types.js";

export function createAuditLogsRetentionService(
    deps: AuditLogsRetentionServiceDeps
): AuditLogsRetentionService {
    return {
        withTx(tx: unknown) {
            return createAuditLogsRetentionService({
                ...deps,
                auditLogsRetentionRepo: deps.auditLogsRetentionRepo.withTx(tx)
            });
        },



        deleteBefore(input) {
            return deps.auditLogsRetentionRepo.deleteBefore(input);
        }
    };
}


