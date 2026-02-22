import { createAlertRulesService } from "../alerts/services/alertRules.service.js";
import type { AlertRulesRepo } from "../alerts/repos/alertRules.repo.js";

type LegacyDeps = {
    rulesRepo: AlertRulesRepo;
};

export function createListAlertRulesUC(deps: LegacyDeps) {
    const service = createAlertRulesService({
        rulesRepo: deps.rulesRepo,
        idGen: { nextId: () => "unused" },
        clock: { now: () => new Date() }
    });
    return (input: { limit: number; offset: number; onlyEnabled?: boolean }) => service.list(input);
}
