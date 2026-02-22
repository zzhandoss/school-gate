import { z } from "zod";
import { runtimeSettingKeys, type RetentionWorkerConfig, type RetentionRuntimeOverrides } from "../../../config/runtimeConfig.js";
import { defineGroupRegistry, defineSettingEntry } from "../types.js";

const positiveInt = z.coerce.number().int().positive();

export const retentionRegistry = defineGroupRegistry({
    name: "retention",
    getEnvConfig(provider): RetentionWorkerConfig {
        return provider.getRetentionEnvConfig();
    },
    applyOverrides(provider, overrides: RetentionRuntimeOverrides): RetentionWorkerConfig {
        return provider.applyRetentionOverrides(overrides);
    },
    createOverrides(): RetentionRuntimeOverrides {
        return {};
    },
    entries: [
        defineSettingEntry({
            key: runtimeSettingKeys.retentionPollMs,
            field: "pollMs",
            parser: positiveInt,
            selectFromConfig: (config: RetentionWorkerConfig) => config.pollMs,
            setOverride: (overrides: RetentionRuntimeOverrides, value) => {
                overrides.pollMs = value;
            },
            parseInput: (input) => positiveInt.optional().parse(input),
            serialize: (value) => value.toString(),
        }),
        defineSettingEntry({
            key: runtimeSettingKeys.retentionBatch,
            field: "batch",
            parser: positiveInt,
            selectFromConfig: (config: RetentionWorkerConfig) => config.batch,
            setOverride: (overrides: RetentionRuntimeOverrides, value) => {
                overrides.batch = value;
            },
            parseInput: (input) => positiveInt.optional().parse(input),
            serialize: (value) => value.toString(),
        }),
        defineSettingEntry({
            key: runtimeSettingKeys.retentionAccessEventsDays,
            field: "accessEventsDays",
            parser: positiveInt,
            selectFromConfig: (config: RetentionWorkerConfig) => config.accessEventsDays,
            setOverride: (overrides: RetentionRuntimeOverrides, value) => {
                overrides.accessEventsDays = value;
            },
            parseInput: (input) => positiveInt.optional().parse(input),
            serialize: (value) => value.toString(),
        }),
        defineSettingEntry({
            key: runtimeSettingKeys.retentionAuditLogsDays,
            field: "auditLogsDays",
            parser: positiveInt,
            selectFromConfig: (config: RetentionWorkerConfig) => config.auditLogsDays,
            setOverride: (overrides: RetentionRuntimeOverrides, value) => {
                overrides.auditLogsDays = value;
            },
            parseInput: (input) => positiveInt.optional().parse(input),
            serialize: (value) => value.toString(),
        }),
    ],
});
