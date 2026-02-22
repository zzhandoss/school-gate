import { createAlertRulesService } from "../alerts/services/alertRules.service.js";
import type { AlertRulesRepo } from "../alerts/repos/alertRules.repo.js";
import type { Clock } from "../utils/common.types.js";

type LegacyDeps = {
    rulesRepo: AlertRulesRepo;
    clock: Clock;
};

export function createUpdateAlertRuleUC(deps: LegacyDeps) {
    const service = createAlertRulesService({
        rulesRepo: deps.rulesRepo,
        idGen: { nextId: () => "unused" },
        clock: deps.clock
    });
    return (input: {
        ruleId: string;
        name?: string;
        severity?: any;
        isEnabled?: boolean;
        config?: unknown;
        actorId?: string;
    }) => service.update(input);
}
