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

export function getConfigHint(type: AlertRuleType) {
    switch (type) {
        case "worker_stale":
            return "Optionally limit by workerId.";
        case "outbox_backlog":
            return "Set at least one threshold: maxNew or maxOldestAgeMs.";
        case "bot_down":
            return "No extra config is required.";
        case "access_event_lag":
            return "maxOldestAgeMs is required.";
        case "error_spike":
            return "Source and increaseBy are required.";
        case "device_service_down":
            return "No extra config is required.";
        case "adapter_down":
            return "Optionally scope by adapterId or vendorKey.";
    }
}

export function buildAlertRuleConfig(input: BuildConfigInput) {
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
                    error: "Outbox thresholds must be positive integers."
                };
            }
            if (maxNew === undefined && maxOldestAgeMs === undefined) {
                return {
                    error: "Provide maxNew or maxOldestAgeMs for outbox backlog."
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
                    error: "maxOldestAgeMs is required and must be a positive integer."
                };
            }
            return { config: { maxOldestAgeMs } };
        }
        case "error_spike": {
            const increaseBy = toPositiveInteger(input.errorSpikeIncreaseBy);
            if (increaseBy === null || increaseBy === undefined) {
                return {
                    error: "increaseBy is required and must be a positive integer."
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
