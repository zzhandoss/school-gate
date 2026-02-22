import { createCleanupRetentionFlow } from "../retention/flows/cleanupRetention.flow.js";
import { createAccessEventsRetentionService } from "../retention/services/accessEventsRetention.service.js";
import { createAuditLogsRetentionService } from "../retention/services/auditLogsRetention.service.js";
import type { AccessEventsRetentionRepo } from "../retention/repos/accessEventsRetention.repo.js";
import type { AuditLogsRetentionRepo } from "../retention/repos/auditLogsRetention.repo.js";

type LegacyDeps = {
    accessEventsRetentionRepo: AccessEventsRetentionRepo;
    auditLogsRetentionRepo: AuditLogsRetentionRepo;
};

export function createCleanupRetentionUC(deps: LegacyDeps) {
    return createCleanupRetentionFlow({
        accessEventsRetentionService: createAccessEventsRetentionService({
            accessEventsRetentionRepo: deps.accessEventsRetentionRepo
        }),
        auditLogsRetentionService: createAuditLogsRetentionService({
            auditLogsRetentionRepo: deps.auditLogsRetentionRepo
        })
    });
}
