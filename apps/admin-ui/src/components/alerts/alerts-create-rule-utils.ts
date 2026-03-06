import type { AlertRule, AlertRuleType } from "@/lib/alerts/types";

type BuildConfigInput = {
    type: AlertRuleType
    workerId: string
    outboxSource: "core" | "device_service"
    outboxMaxNew: string
    outboxMaxOldestAgeMs: string
    accessEventMaxOldestAgeMs: string
    errorSpikeSource: "access_events" | "outbox"
    errorSpikeIncreaseBy: string
    adapterId: string
    adapterVendorKey: string
};

type BuildAlertRuleConfigResult =
  | { config: Record<string, unknown> }
  | { errorKey: string };

export function toPositiveInteger(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
        return undefined;
    }
    const parsed = Number.parseInt(trimmed, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        return null;
    }
    return parsed;
}

export function getConfigHintKey(type: AlertRuleType) {
    switch (type) {
        case "worker_stale":
            return "alerts.ruleForm.hints.workerStale";
        case "outbox_backlog":
            return "alerts.ruleForm.hints.outboxBacklog";
        case "bot_down":
            return "alerts.ruleForm.hints.botDown";
        case "access_event_lag":
            return "alerts.ruleForm.hints.accessEventLag";
        case "error_spike":
            return "alerts.ruleForm.hints.errorSpike";
        case "device_service_down":
            return "alerts.ruleForm.hints.deviceServiceDown";
        case "adapter_down":
            return "alerts.ruleForm.hints.adapterDown";
    }

    return "alerts.ruleForm.hints.botDown";
}

export function buildAlertRuleConfig(input: BuildConfigInput): BuildAlertRuleConfigResult {
    const { type } = input;
    switch (type) {
        case "worker_stale": {
            const value = input.workerId.trim();
            return {
                config: value ? { workerId: value } : {}
            };
        }
        case "outbox_backlog": {
            const maxNew = toPositiveInteger(input.outboxMaxNew);
            const maxOldestAgeMs = toPositiveInteger(input.outboxMaxOldestAgeMs);
            if (maxNew === null || maxOldestAgeMs === null) {
                return {
                    errorKey: "alerts.ruleForm.errors.outboxThresholdsPositive"
                };
            }
            if (maxNew === undefined && maxOldestAgeMs === undefined) {
                return {
                    errorKey: "alerts.ruleForm.errors.outboxThresholdRequired"
                };
            }
            return {
                config: {
                    source: input.outboxSource,
                    ...(maxNew !== undefined ? { maxNew } : {}),
                    ...(maxOldestAgeMs !== undefined ? { maxOldestAgeMs } : {})
                }
            };
        }
        case "bot_down":
            return { config: {} };
        case "access_event_lag": {
            const maxOldestAgeMs = toPositiveInteger(input.accessEventMaxOldestAgeMs);
            if (maxOldestAgeMs === null || maxOldestAgeMs === undefined) {
                return {
                    errorKey: "alerts.ruleForm.errors.accessEventLagRequired"
                };
            }
            return { config: { maxOldestAgeMs } };
        }
        case "error_spike": {
            const increaseBy = toPositiveInteger(input.errorSpikeIncreaseBy);
            if (increaseBy === null || increaseBy === undefined) {
                return {
                    errorKey: "alerts.ruleForm.errors.errorSpikeIncreaseRequired"
                };
            }
            return {
                config: {
                    source: input.errorSpikeSource,
                    increaseBy
                }
            };
        }
        case "device_service_down":
            return { config: {} };
        case "adapter_down": {
            const adapterId = input.adapterId.trim();
            const vendorKey = input.adapterVendorKey.trim();
            return {
                config: {
                    ...(adapterId ? { adapterId } : {}),
                    ...(vendorKey ? { vendorKey } : {})
                }
            };
        }
    }

    return {
        errorKey: "alerts.ruleForm.errors.invalidConfig"
    };
}

export function getRuleConfigDefaults(rule: AlertRule) {
    const config = rule.config;
    return {
        workerId: typeof config.workerId === "string" ? config.workerId : "",
        outboxSource: config.source === "device_service" ? "device_service" : "core",
        outboxMaxNew:
      typeof config.maxNew === "number" && Number.isFinite(config.maxNew)
          ? String(config.maxNew)
          : "",
        outboxMaxOldestAgeMs:
      typeof config.maxOldestAgeMs === "number" && Number.isFinite(config.maxOldestAgeMs)
          ? String(config.maxOldestAgeMs)
          : "",
        accessEventMaxOldestAgeMs:
      typeof config.maxOldestAgeMs === "number" && Number.isFinite(config.maxOldestAgeMs)
          ? String(config.maxOldestAgeMs)
          : "",
        errorSpikeSource: config.source === "outbox" ? "outbox" : "access_events",
        errorSpikeIncreaseBy:
      typeof config.increaseBy === "number" && Number.isFinite(config.increaseBy)
          ? String(config.increaseBy)
          : "",
        adapterId: typeof config.adapterId === "string" ? config.adapterId : "",
        adapterVendorKey: typeof config.vendorKey === "string" ? config.vendorKey : ""
    } as const;
}
