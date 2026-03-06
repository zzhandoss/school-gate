import type { Outbox } from "../../ports/outbox.js";
import type { Clock, IdGenerator } from "../../utils/common.types.js";
import type { AlertRulesRepo } from "../repos/alertRules.repo.js";
import type { AlertRulesService } from "../services/alertRules.types.js";

export type DeleteAlertRuleInput = {
    ruleId: string;
    adminId?: string | undefined;
};

export type DeleteAlertRuleResult = {
    ruleId: string;
    deleted: true;
};

export type DeleteAlertRuleTxServices = {
    rulesRepo: Pick<AlertRulesRepo, "deleteByIdSync">;
    outbox: Outbox;
};

export type DeleteAlertRuleTx = {
    run<T>(cb: (deps: DeleteAlertRuleTxServices) => T): T;
};

export type DeleteAlertRuleFlow = (input: DeleteAlertRuleInput) => Promise<DeleteAlertRuleResult>;

export type DeleteAlertRuleFlowDeps = {
    tx: DeleteAlertRuleTx;
    idGen: IdGenerator;
    clock: Clock;
    rulesService: Pick<AlertRulesService, "getById">;
};
