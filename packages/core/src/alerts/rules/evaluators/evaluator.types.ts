import type { AlertSeverity } from "../../entities/alertSeverity.types.js";
import type { AlertEventDetails } from "../../entities/alertEvents.types.js";
import type { MonitoringSnapshot } from "../../../monitoring/index.js";

export type RuleEvaluation = {
    condition: boolean;
    triggeredMessage: string;
    resolvedMessage: string;
    details: AlertEventDetails | null;
    skipReason?: string | undefined;
};

export type RuleEvaluationContext = {
    snapshot: MonitoringSnapshot;
    previousSnapshot?: MonitoringSnapshot | undefined;
};

export type RuleEvaluator<RuleType extends string, Config> = (input: {
    rule: {
        type: RuleType;
        config: Config;
        name: string;
        severity: AlertSeverity;
    };
    context: RuleEvaluationContext;
}) => RuleEvaluation;
