import type {
    AlertRuleConfig,
    AlertRuleType,
    AlertSeverity,
    UnknownAlertRule,
} from "../entities/alertRules.types.js";

export type CreateAlertRuleInput<K extends AlertRuleType> = {
    id: string;
    name: string;
    severity: AlertSeverity;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    type: K;
    config: AlertRuleConfig<K>;
};

export type UpdateAlertRuleInput<K extends AlertRuleType> = {
    id: string;
    name?: string | undefined;
    severity?: AlertSeverity | undefined;
    isEnabled?: boolean | undefined;
    config?: AlertRuleConfig<K> | undefined;
    updatedAt: Date;
};

export type ListAlertRulesInput = {
    limit: number;
    offset: number;
    onlyEnabled?: boolean | undefined;
};

export interface AlertRulesRepo {
    create<K extends AlertRuleType>(input: CreateAlertRuleInput<K>): Promise<void>;
    update<K extends AlertRuleType>(input: UpdateAlertRuleInput<K>): Promise<boolean>;
    getById(id: string): Promise<UnknownAlertRule | null>;
    list(input: ListAlertRulesInput): Promise<UnknownAlertRule[]>;
    withTx(tx: unknown): AlertRulesRepo;
}

