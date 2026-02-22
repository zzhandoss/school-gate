import { asOptionalString, asRecord } from "../helpers.js";
import type { RuleEvaluator } from "./evaluator.types.js";

export function parseWorkerStaleConfig(raw: unknown) {
    const config = asRecord(raw ?? {}, "alert rule config");
    const workerId = asOptionalString(config.workerId, "workerId");
    return { workerId };
}

type WorkerStaleConfig = ReturnType<typeof parseWorkerStaleConfig>;

export const evaluateWorkerStaleRule: RuleEvaluator<"worker_stale", WorkerStaleConfig> = ({
    rule,
    context
}) => {
    const targetId = rule.config.workerId;
    const workers = context.snapshot.workers;
    const matching = targetId ? workers.filter((worker) => worker.workerId === targetId) : workers;
    const stale = matching.filter((worker) => worker.status === "stale");
    const missingTarget = Boolean(targetId && matching.length === 0);
    const condition = stale.length > 0 || missingTarget;
    const details = {
        targetId: targetId ?? null,
        staleWorkers: stale.map((worker) => worker.workerId),
        missingTarget
    };
    return {
        condition,
        triggeredMessage: missingTarget
            ? `worker ${targetId} is missing from monitoring`
            : `stale workers: ${stale.map((worker) => worker.workerId).join(", ")}`,
        resolvedMessage: "all monitored workers are healthy",
        details
    };
};
