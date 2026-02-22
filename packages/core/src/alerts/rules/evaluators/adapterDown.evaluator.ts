import { asOptionalString, asRecord } from "../helpers.js";
import type { RuleEvaluator } from "./evaluator.types.js";

export function parseAdapterDownConfig(raw: unknown) {
    const config = asRecord(raw ?? {}, "alert rule config");
    const adapterId = asOptionalString(config.adapterId, "adapterId");
    const vendorKey = asOptionalString(config.vendorKey, "vendorKey");
    return { adapterId, vendorKey };
}

type AdapterDownConfig = ReturnType<typeof parseAdapterDownConfig>;

export const evaluateAdapterDownRule: RuleEvaluator<"adapter_down", AdapterDownConfig> = ({
    rule,
    context
}) => {
    if (!context.snapshot.deviceService) {
        return {
            condition: true,
            triggeredMessage: "device service monitoring unavailable",
            resolvedMessage: "device service monitoring restored",
            details: { reason: "device_service_unavailable" }
        };
    }
    const cfg = rule.config;
    const adapters = context.snapshot.deviceService.adapters.filter((adapter) => {
        const idMatch = cfg.adapterId ? adapter.adapterId === cfg.adapterId : true;
        const vendorMatch = cfg.vendorKey ? adapter.vendorKey === cfg.vendorKey : true;
        return idMatch && vendorMatch;
    });
    const missingTarget = adapters.length === 0;
    const stale = adapters.filter((adapter) => adapter.status === "stale");
    const condition = missingTarget || stale.length > 0;
    return {
        condition,
        triggeredMessage: missingTarget
            ? "adapter target missing from monitoring"
            : `stale adapters: ${stale.map((adapter) => adapter.adapterId).join(", ")}`,
        resolvedMessage: "all monitored adapters are healthy",
        details: {
            adapterId: cfg.adapterId ?? null,
            vendorKey: cfg.vendorKey ?? null,
            missingTarget,
            staleAdapters: stale.map((adapter) => adapter.adapterId)
        }
    };
};
