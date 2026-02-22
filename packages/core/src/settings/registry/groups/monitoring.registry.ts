import { z } from "zod";
import { runtimeSettingKeys, type MonitoringConfig, type MonitoringRuntimeOverrides } from "../../../config/runtimeConfig.js";
import { defineGroupRegistry, defineSettingEntry } from "../types.js";

const positiveInt = z.coerce.number().int().positive();

export const monitoringRegistry = defineGroupRegistry({
    name: "monitoring",
    getEnvConfig(provider): MonitoringConfig {
        return provider.getMonitoringEnvConfig();
    },
    applyOverrides(provider, overrides: MonitoringRuntimeOverrides): MonitoringConfig {
        return provider.applyMonitoringOverrides(overrides);
    },
    createOverrides(): MonitoringRuntimeOverrides {
        return {};
    },
    entries: [
        defineSettingEntry({
            key: runtimeSettingKeys.monitoringWorkerTtlMs,
            field: "workerTtlMs",
            parser: positiveInt,
            selectFromConfig: (config: MonitoringConfig) => config.workerTtlMs,
            setOverride: (overrides: MonitoringRuntimeOverrides, value) => {
                overrides.workerTtlMs = value;
            },
            parseInput: (input) => positiveInt.optional().parse(input),
            serialize: (value) => value.toString(),
        }),
    ],
});
