import { asEnum, asOptionalPositiveInt, asRecord } from "../helpers.js";
import type { RuleEvaluator } from "./evaluator.types.js";

export function parseOutboxBacklogConfig(raw: unknown) {
    const config = asRecord(raw ?? {}, "alert rule config");
    const source = asEnum(config.source, "source", ["core", "device_service"] as const);
    const maxNew = asOptionalPositiveInt(config.maxNew, "maxNew");
    const maxOldestAgeMs = asOptionalPositiveInt(config.maxOldestAgeMs, "maxOldestAgeMs");
    if (maxNew === undefined && maxOldestAgeMs === undefined) {
        throw new Error("outbox_backlog config requires maxNew or maxOldestAgeMs");
    }
    return { source, maxNew, maxOldestAgeMs };
}

type OutboxBacklogConfig = ReturnType<typeof parseOutboxBacklogConfig>;

function calcAgeMs(now: Date, since: Date): number {
    return now.getTime() - since.getTime();
}

export const evaluateOutboxBacklogRule: RuleEvaluator<"outbox_backlog", OutboxBacklogConfig> = ({
    rule,
    context,
}) => {
    const cfg = rule.config;
    const source = cfg.source;
    const snapshot = context.snapshot;
    const outbox = source === "core" ? snapshot.outbox : snapshot.deviceService?.outbox ?? null;
    if (!outbox) {
        return {
            condition: true,
            triggeredMessage: "device service monitoring unavailable",
            resolvedMessage: "device service monitoring restored",
            details: { source, reason: "device_service_unavailable" },
        };
    }
    const countNew = outbox.counts.new ?? 0;
    const oldest = outbox.oldestNewCreatedAt;
    const ageMs = oldest ? calcAgeMs(snapshot.now, oldest) : null;
    const triggeredByCount = cfg.maxNew !== undefined && countNew >= cfg.maxNew;
    const triggeredByAge = cfg.maxOldestAgeMs !== undefined && ageMs !== null && ageMs >= cfg.maxOldestAgeMs;
    const condition = triggeredByCount || triggeredByAge;
    const details = {
        source,
        countNew,
        maxNew: cfg.maxNew ?? null,
        oldestNewCreatedAt: oldest ? oldest.toISOString() : null,
        oldestAgeMs: ageMs,
        maxOldestAgeMs: cfg.maxOldestAgeMs ?? null,
    };
    return {
        condition,
        triggeredMessage: `outbox backlog (${source}) new=${countNew} oldestAgeMs=${ageMs ?? "n/a"}`,
        resolvedMessage: `outbox backlog cleared (${source})`,
        details,
    };
};
