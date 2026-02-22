import { z } from "zod";
import { runtimeSettingKeys, type WorkerConfig, type WorkerRuntimeOverrides } from "../../../config/runtimeConfig.js";
import { defineGroupRegistry, defineSettingEntry } from "../types.js";

const positiveInt = z.coerce.number().int().positive();
const boolString = z.enum(["true", "false"]).transform((v) => v === "true");

export const workerRegistry = defineGroupRegistry({
    name: "worker",
    getEnvConfig(provider): WorkerConfig {
        return provider.getWorkerEnvConfig();
    },
    applyOverrides(provider, overrides: WorkerRuntimeOverrides): WorkerConfig {
        return provider.applyWorkerOverrides(overrides);
    },
    createOverrides(): WorkerRuntimeOverrides {
        return {};
    },
    entries: [
        defineSettingEntry({
            key: runtimeSettingKeys.workerPollMs,
            field: "pollMs",
            parser: positiveInt,
            selectFromConfig: (config: WorkerConfig) => config.pollMs,
            setOverride: (overrides: WorkerRuntimeOverrides, value) => {
                overrides.pollMs = value;
            },
            parseInput: (input) => positiveInt.optional().parse(input),
            serialize: (value) => value.toString()
        }),
        defineSettingEntry({
            key: runtimeSettingKeys.workerBatch,
            field: "batch",
            parser: positiveInt,
            selectFromConfig: (config: WorkerConfig) => config.batch,
            setOverride: (overrides: WorkerRuntimeOverrides, value) => {
                overrides.batch = value;
            },
            parseInput: (input) => positiveInt.optional().parse(input),
            serialize: (value) => value.toString()
        }),
        defineSettingEntry({
            key: runtimeSettingKeys.featureAutoResolvePerson,
            field: "autoResolvePersonByIin",
            parser: boolString,
            selectFromConfig: (config: WorkerConfig) => config.autoResolvePersonByIin,
            setOverride: (overrides: WorkerRuntimeOverrides, value) => {
                overrides.autoResolvePersonByIin = value;
            },
            parseInput: (input) => z.boolean().optional().parse(input),
            serialize: (value) => String(value)
        })
    ]
});
