import type { RuleEvaluator } from "./evaluator.types.js";

export function parseBotDownConfig(_raw: unknown) {
    return {};
}

type BotDownConfig = ReturnType<typeof parseBotDownConfig>;

export const evaluateBotDownRule: RuleEvaluator<"bot_down", BotDownConfig> = ({ context }) => {
    const component = context.snapshot.components.find((c) => c.componentId === "bot") ?? null;
    const condition = !component || component.status === "down";
    const details = {
        status: component?.status ?? "down",
        checkedAt: component?.checkedAt.toISOString() ?? null,
        error: component?.error ?? null
    };
    return {
        condition,
        triggeredMessage: "bot health check is down",
        resolvedMessage: "bot health check is ok",
        details
    };
};
