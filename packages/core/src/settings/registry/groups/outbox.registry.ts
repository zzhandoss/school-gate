import { z } from "zod";
import { runtimeSettingKeys, type OutboxWorkerConfig, type OutboxRuntimeOverrides } from "../../../config/runtimeConfig.js";
import { defineGroupRegistry, defineSettingEntry } from "../types.js";

const positiveInt = z.coerce.number().int().positive();
const nonEmptyString = z.string().min(1);

export const outboxRegistry = defineGroupRegistry({
    name: "outbox",
    getEnvConfig(provider): OutboxWorkerConfig {
        return provider.getOutboxEnvConfig();
    },
    applyOverrides(provider, overrides: OutboxRuntimeOverrides): OutboxWorkerConfig {
        return provider.applyOutboxOverrides(overrides);
    },
    createOverrides(): OutboxRuntimeOverrides {
        return {};
    },
    entries: [
        defineSettingEntry({
            key: runtimeSettingKeys.outboxPollMs,
            field: "pollMs",
            parser: positiveInt,
            selectFromConfig: (config: OutboxWorkerConfig) => config.pollMs,
            setOverride: (overrides: OutboxRuntimeOverrides, value) => {
                overrides.pollMs = value;
            },
            parseInput: (input) => positiveInt.optional().parse(input),
            serialize: (value) => value.toString()
        }),
        defineSettingEntry({
            key: runtimeSettingKeys.outboxBatch,
            field: "batch",
            parser: positiveInt,
            selectFromConfig: (config: OutboxWorkerConfig) => config.batch,
            setOverride: (overrides: OutboxRuntimeOverrides, value) => {
                overrides.batch = value;
            },
            parseInput: (input) => positiveInt.optional().parse(input),
            serialize: (value) => value.toString()
        }),
        defineSettingEntry({
            key: runtimeSettingKeys.outboxMaxAttempts,
            field: "maxAttempts",
            parser: positiveInt,
            selectFromConfig: (config: OutboxWorkerConfig) => config.maxAttempts,
            setOverride: (overrides: OutboxRuntimeOverrides, value) => {
                overrides.maxAttempts = value;
            },
            parseInput: (input) => positiveInt.optional().parse(input),
            serialize: (value) => value.toString()
        }),
        defineSettingEntry({
            key: runtimeSettingKeys.outboxLeaseMs,
            field: "leaseMs",
            parser: positiveInt,
            selectFromConfig: (config: OutboxWorkerConfig) => config.leaseMs,
            setOverride: (overrides: OutboxRuntimeOverrides, value) => {
                overrides.leaseMs = value;
            },
            parseInput: (input) => positiveInt.optional().parse(input),
            serialize: (value) => value.toString()
        }),
        defineSettingEntry({
            key: runtimeSettingKeys.outboxProcessingBy,
            field: "processingBy",
            parser: nonEmptyString,
            selectFromConfig: (config: OutboxWorkerConfig) => config.processingBy,
            setOverride: (overrides: OutboxRuntimeOverrides, value) => {
                overrides.processingBy = value;
            },
            parseInput: (input) => nonEmptyString.optional().parse(input),
            serialize: (value) => value
        })
    ]
});
