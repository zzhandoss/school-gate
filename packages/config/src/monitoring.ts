import { z } from "zod";
import { parseEnv } from "./parseEnv.js";
import type { MonitoringConfig } from "@school-gate/core";

const monitoringSchema = z.object({
    MONITORING_WORKER_TTL_MS: z.coerce.number().int().positive().default(120_000),
});

function applyOverrides<T extends Record<string, unknown>>(base: T, overrides?: Partial<T>): T {
    if (!overrides) return base;
    const merged: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(overrides)) {
        if (value !== undefined) {
            merged[key] = value;
        }
    }
    return merged as T;
}

export function getMonitoringConfig(overrides?: Partial<MonitoringConfig>): MonitoringConfig {
    const parsed = parseEnv(monitoringSchema, "monitoring");
    const base: MonitoringConfig = {
        workerTtlMs: parsed.MONITORING_WORKER_TTL_MS,
    };
    return applyOverrides(base, overrides);
}
