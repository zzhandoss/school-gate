import { asPositiveInt, asRecord } from "../helpers.js";
import type { RuleEvaluator } from "./evaluator.types.js";

export function parseAccessEventLagConfig(raw: unknown) {
    const config = asRecord(raw ?? {}, "alert rule config");
    const maxOldestAgeMs = asPositiveInt(config.maxOldestAgeMs, "maxOldestAgeMs");
    return { maxOldestAgeMs };
}

type AccessEventLagConfig = ReturnType<typeof parseAccessEventLagConfig>;

function calcAgeMs(now: Date, since: Date): number {
    return now.getTime() - since.getTime();
}

export const evaluateAccessEventLagRule: RuleEvaluator<"access_event_lag", AccessEventLagConfig> = ({
    rule,
    context
}) => {
    const maxOldestAgeMs = rule.config.maxOldestAgeMs;
    const oldest = context.snapshot.accessEvents.oldestUnprocessedOccurredAt;
    if (!oldest) {
        return {
            condition: false,
            triggeredMessage: "access event lag threshold reached",
            resolvedMessage: "access event lag cleared",
            details: { oldestUnprocessedOccurredAt: null, ageMs: null, maxOldestAgeMs }
        };
    }
    const ageMs = calcAgeMs(context.snapshot.now, oldest);
    const condition = ageMs >= maxOldestAgeMs;
    return {
        condition,
        triggeredMessage: `access event lag ageMs=${ageMs}`,
        resolvedMessage: "access event lag cleared",
        details: {
            oldestUnprocessedOccurredAt: oldest.toISOString(),
            ageMs,
            maxOldestAgeMs
        }
    };
};
