import type { AlertSeverity } from "../entities/alertSeverity.types.js";
import type { RuleEvaluation, RuleEvaluationContext, RuleEvaluator } from "./evaluators/evaluator.types.js";
import { parseWorkerStaleConfig, evaluateWorkerStaleRule } from "./evaluators/workerStale.evaluator.js";
import { parseOutboxBacklogConfig, evaluateOutboxBacklogRule } from "./evaluators/outboxBacklog.evaluator.js";
import { parseBotDownConfig, evaluateBotDownRule } from "./evaluators/botDown.evaluator.js";
import { parseAccessEventLagConfig, evaluateAccessEventLagRule } from "./evaluators/accessEventLag.evaluator.js";
import { parseErrorSpikeConfig, evaluateErrorSpikeRule } from "./evaluators/errorSpike.evaluator.js";
import { parseDeviceServiceDownConfig, evaluateDeviceServiceDownRule } from "./evaluators/deviceServiceDown.evaluator.js";
import { parseAdapterDownConfig, evaluateAdapterDownRule } from "./evaluators/adapterDown.evaluator.js";

export const alertRuleRegistry = {
    worker_stale: {
        parse: parseWorkerStaleConfig,
        evaluate: evaluateWorkerStaleRule
    },
    outbox_backlog: {
        parse: parseOutboxBacklogConfig,
        evaluate: evaluateOutboxBacklogRule
    },
    bot_down: {
        parse: parseBotDownConfig,
        evaluate: evaluateBotDownRule
    },
    access_event_lag: {
        parse: parseAccessEventLagConfig,
        evaluate: evaluateAccessEventLagRule
    },
    error_spike: {
        parse: parseErrorSpikeConfig,
        evaluate: evaluateErrorSpikeRule
    },
    device_service_down: {
        parse: parseDeviceServiceDownConfig,
        evaluate: evaluateDeviceServiceDownRule
    },
    adapter_down: {
        parse: parseAdapterDownConfig,
        evaluate: evaluateAdapterDownRule
    }
} as const;

export type AlertRuleType = keyof typeof alertRuleRegistry;

export type AlertRuleConfig<T extends AlertRuleType> = ReturnType<(typeof alertRuleRegistry)[T]["parse"]>;

export type AlertRuleLike<T extends AlertRuleType = AlertRuleType> = {
    type: T;
    config: AlertRuleConfig<T>;
    name: string;
    severity: AlertSeverity;
};

export function parseAlertRuleConfig<T extends AlertRuleType>(type: T, raw: unknown) {
    return alertRuleRegistry[type].parse(raw) as AlertRuleConfig<T>;
}

export function evaluateAlertRule<T extends AlertRuleType>(
    rule: AlertRuleLike<T>,
    context: RuleEvaluationContext
): RuleEvaluation {
    const evaluator = alertRuleRegistry[rule.type].evaluate as RuleEvaluator<T, AlertRuleConfig<T>>;
    return evaluator({ rule, context });
}
