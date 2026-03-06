import { enqueueAuditRequested } from "../../audit/events/auditRequested.js";
import { AlertRuleNotFoundError } from "../../utils/errors.js";
import type { DeleteAlertRuleFlow, DeleteAlertRuleFlowDeps } from "./deleteAlertRule.types.js";

export function createDeleteAlertRuleFlow(deps: DeleteAlertRuleFlowDeps): DeleteAlertRuleFlow {
    return async function deleteAlertRule(input) {
        const rule = await deps.rulesService.getById(input.ruleId);
        if (!rule) {
            throw new AlertRuleNotFoundError();
        }

        const deletedAt = deps.clock.now();

        return deps.tx.run(({ rulesRepo, outbox }) => {
            const deleted = rulesRepo.deleteByIdSync(rule.id);
            if (!deleted) {
                throw new AlertRuleNotFoundError();
            }

            enqueueAuditRequested({
                outbox,
                id: deps.idGen.nextId(),
                actorId: input.adminId ?? "system:alert_rule_delete",
                action: "alert_rule_deleted",
                entityType: "alert_rule",
                entityId: rule.id,
                at: deletedAt,
                meta: {
                    name: rule.name,
                    type: rule.type,
                    severity: rule.severity,
                    cascadesAlertSubscriptions: true,
                    cascadesAlertEvents: true
                }
            });

            return {
                ruleId: rule.id,
                deleted: true as const
            };
        });
    };
}
