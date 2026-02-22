import { createAlertRulesService } from "../alerts/services/alertRules.service.js";
import type { AlertRulesRepo } from "../alerts/repos/alertRules.repo.js";
import type { IdGenerator, Clock } from "../utils/common.types.js";

type LegacyDeps = {
    rulesRepo: AlertRulesRepo;
    idGen: IdGenerator;
    clock: Clock;
};

export function createCreateAlertRuleUC(deps: LegacyDeps) {
    const service = createAlertRulesService({
        rulesRepo: deps.rulesRepo,
        idGen: deps.idGen,
        clock: deps.clock
    });
    return (input: {
        name: string;
        type: any;
        severity: any;
        isEnabled: boolean;
        config: Record<string, unknown>;
        actorId?: string;
    }) => service.create(input);
}
