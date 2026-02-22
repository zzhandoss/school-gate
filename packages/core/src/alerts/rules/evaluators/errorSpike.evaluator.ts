import { asEnum, asPositiveInt, asRecord } from "../helpers.js";
import type { RuleEvaluator } from "./evaluator.types.js";
import type { MonitoringSnapshot } from "../../../monitoring/index.js";

function sumErrors(list: MonitoringSnapshot["topErrors"]["accessEvents"]): number {
    return list.reduce((acc, stat) => acc + stat.count, 0);
}

export function parseErrorSpikeConfig(raw: unknown) {
    const config = asRecord(raw ?? {}, "alert rule config");
    const source = asEnum(config.source, "source", ["access_events", "outbox"] as const);
    const increaseBy = asPositiveInt(config.increaseBy, "increaseBy");
    return { source, increaseBy };
}

type ErrorSpikeConfig = ReturnType<typeof parseErrorSpikeConfig>;

export const evaluateErrorSpikeRule: RuleEvaluator<"error_spike", ErrorSpikeConfig> = ({
    rule,
    context
}) => {
    const previousSnapshot = context.previousSnapshot;
    if (!previousSnapshot) {
        return {
            condition: false,
            triggeredMessage: "error spike threshold reached",
            resolvedMessage: "error spike cleared",
            details: null,
            skipReason: "previous_snapshot_missing"
        };
    }
    const source = rule.config.source;
    const currentTotal =
        source === "access_events"
            ? sumErrors(context.snapshot.topErrors.accessEvents)
            : sumErrors(context.snapshot.topErrors.outbox);
    const previousTotal =
        source === "access_events"
            ? sumErrors(previousSnapshot.topErrors.accessEvents)
            : sumErrors(previousSnapshot.topErrors.outbox);
    const delta = currentTotal - previousTotal;
    const condition = delta >= rule.config.increaseBy;
    return {
        condition,
        triggeredMessage: `error spike ${source} delta=${delta}`,
        resolvedMessage: `error spike cleared (${source})`,
        details: {
            source,
            currentTotal,
            previousTotal,
            delta,
            increaseBy: rule.config.increaseBy
        }
    };
};
