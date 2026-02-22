import { z } from "zod";
import {
    runtimeSettingKeys,
    type AccessEventsWorkerConfig,
    type AccessEventsRuntimeOverrides
} from "../../../config/runtimeConfig.js";
import { defineGroupRegistry, defineSettingEntry } from "../types.js";

const positiveInt = z.coerce.number().int().positive();
const nonEmptyString = z.string().min(1);

export const accessEventsRegistry = defineGroupRegistry({
    name: "accessEvents",
    getEnvConfig(provider): AccessEventsWorkerConfig {
        return provider.getAccessEventsEnvConfig();
    },
    applyOverrides(provider, overrides: AccessEventsRuntimeOverrides): AccessEventsWorkerConfig {
        return provider.applyAccessEventsOverrides(overrides);
    },
    createOverrides(): AccessEventsRuntimeOverrides {
        return {};
    },
    entries: [
        defineSettingEntry({
            key: runtimeSettingKeys.accessEventsPollMs,
            field: "pollMs",
            parser: positiveInt,
            selectFromConfig: (config: AccessEventsWorkerConfig) => config.pollMs,
            setOverride: (overrides: AccessEventsRuntimeOverrides, value) => {
                overrides.pollMs = value;
            },
            parseInput: (input) => positiveInt.optional().parse(input),
            serialize: (value) => value.toString()
        }),
        defineSettingEntry({
            key: runtimeSettingKeys.accessEventsBatch,
            field: "batch",
            parser: positiveInt,
            selectFromConfig: (config: AccessEventsWorkerConfig) => config.batch,
            setOverride: (overrides: AccessEventsRuntimeOverrides, value) => {
                overrides.batch = value;
            },
            parseInput: (input) => positiveInt.optional().parse(input),
            serialize: (value) => value.toString()
        }),
        defineSettingEntry({
            key: runtimeSettingKeys.accessEventsRetryDelayMs,
            field: "retryDelayMs",
            parser: positiveInt,
            selectFromConfig: (config: AccessEventsWorkerConfig) => config.retryDelayMs,
            setOverride: (overrides: AccessEventsRuntimeOverrides, value) => {
                overrides.retryDelayMs = value;
            },
            parseInput: (input) => positiveInt.optional().parse(input),
            serialize: (value) => value.toString()
        }),
        defineSettingEntry({
            key: runtimeSettingKeys.accessEventsLeaseMs,
            field: "leaseMs",
            parser: positiveInt,
            selectFromConfig: (config: AccessEventsWorkerConfig) => config.leaseMs,
            setOverride: (overrides: AccessEventsRuntimeOverrides, value) => {
                overrides.leaseMs = value;
            },
            parseInput: (input) => positiveInt.optional().parse(input),
            serialize: (value) => value.toString()
        }),
        defineSettingEntry({
            key: runtimeSettingKeys.accessEventsMaxAttempts,
            field: "maxAttempts",
            parser: positiveInt,
            selectFromConfig: (config: AccessEventsWorkerConfig) => config.maxAttempts,
            setOverride: (overrides: AccessEventsRuntimeOverrides, value) => {
                overrides.maxAttempts = value;
            },
            parseInput: (input) => positiveInt.optional().parse(input),
            serialize: (value) => value.toString()
        }),
        defineSettingEntry({
            key: runtimeSettingKeys.accessEventsProcessingBy,
            field: "processingBy",
            parser: nonEmptyString,
            selectFromConfig: (config: AccessEventsWorkerConfig) => config.processingBy,
            setOverride: (overrides: AccessEventsRuntimeOverrides, value) => {
                overrides.processingBy = value;
            },
            parseInput: (input) => nonEmptyString.optional().parse(input),
            serialize: (value) => value
        })
    ]
});
