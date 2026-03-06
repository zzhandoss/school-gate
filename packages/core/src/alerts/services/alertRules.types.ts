import type { OutboxRepo } from "../../ports/outbox.js";
import type { AlertRuleConfig, AlertRuleType, AlertSeverity, UnknownAlertRule } from "../entities/alertRules.types.js";
import type { ListAlertRulesInput } from "../repos/alertRules.repo.js";
import type { AlertRulesRepo } from "../repos/alertRules.repo.js";
import type { Clock, IdGenerator } from "../../utils/index.js";

export type CreateAlertRuleInput = {
    name: string;
    type: AlertRuleType;
    severity: AlertSeverity;
    isEnabled: boolean;
    config: AlertRuleConfig<AlertRuleType>;
    actorId?: string | undefined;
};

export type CreateAlertRuleResult = { ruleId: string };

export type UpdateAlertRuleInput = {
    ruleId: string;
    name?: string | undefined;
    severity?: AlertSeverity | undefined;
    isEnabled?: boolean | undefined;
    config?: unknown | undefined;
    actorId?: string | undefined;
};

export type AlertRulesService = {
    create(input: CreateAlertRuleInput): Promise<CreateAlertRuleResult>;
    update(input: UpdateAlertRuleInput): Promise<void>;
    deleteByIdSync(ruleId: string): boolean;
    getById(id: string): Promise<UnknownAlertRule | null>;
    list(input: ListAlertRulesInput): Promise<UnknownAlertRule[]>;
    withTx(tx: unknown): AlertRulesService;
};

export type AlertRulesServiceDeps = {
    rulesRepo: AlertRulesRepo;
    outbox?: OutboxRepo | undefined;
    idGen: IdGenerator;
    clock: Clock;
};
