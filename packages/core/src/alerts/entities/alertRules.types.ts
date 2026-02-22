import type { AlertRuleConfig, AlertRuleType } from "../rules/registry.js";
import type { AlertSeverity } from "./alertSeverity.types.js";

export type { AlertRuleConfig, AlertRuleType, AlertSeverity };

export type AlertRuleBase = {
    id: string;
    name: string;
    severity: AlertSeverity;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
};

export type AlertRule<K extends AlertRuleType> = AlertRuleBase & { type: K; config: AlertRuleConfig<K> };

export type AlertConfigured<Base> = {
    [K in AlertRuleType]: Base & {
        type: K;
        config: AlertRuleConfig<K>;
    }
}[AlertRuleType];

export type AlertConfigurable<Base> = {
    [K in AlertRuleType]: Base & {
        type: K;
        config: unknown;
    }
}[AlertRuleType];

export type UnknownAlertRule = AlertConfigured<AlertRuleBase>;
