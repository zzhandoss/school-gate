import { z } from "zod";
import {
    runtimeSettingKeys,
    type NotificationsConfig,
    type NotificationsRuntimeOverrides,
} from "../../../config/runtimeConfig.js";
import { defineGroupRegistry, defineSettingEntry } from "../types.js";

const nonEmptyString = z.string().min(1);
const positiveInt = z.coerce.number().int().positive();

export const notificationsRegistry = defineGroupRegistry({
    name: "notifications",
    getEnvConfig(provider): NotificationsConfig {
        return provider.getNotificationsEnvConfig();
    },
    applyOverrides(provider, overrides: NotificationsRuntimeOverrides): NotificationsConfig {
        return provider.applyNotificationsOverrides(overrides);
    },
    createOverrides(): NotificationsRuntimeOverrides {
        return {};
    },
    entries: [
        defineSettingEntry({
            key: runtimeSettingKeys.notificationsParentTemplate,
            field: "parentTemplate",
            parser: nonEmptyString,
            selectFromConfig: (config: NotificationsConfig) => config.parentTemplate,
            setOverride: (overrides: NotificationsRuntimeOverrides, value) => {
                overrides.parentTemplate = value;
            },
            parseInput: (input) => nonEmptyString.optional().parse(input),
            serialize: (value) => value,
        }),
        defineSettingEntry({
            key: runtimeSettingKeys.notificationsParentMaxAgeMs,
            field: "parentMaxAgeMs",
            parser: positiveInt,
            selectFromConfig: (config: NotificationsConfig) => config.parentMaxAgeMs,
            setOverride: (overrides: NotificationsRuntimeOverrides, value) => {
                overrides.parentMaxAgeMs = value;
            },
            parseInput: (input) => positiveInt.optional().parse(input),
            serialize: (value) => value.toString(),
        }),
        defineSettingEntry({
            key: runtimeSettingKeys.notificationsAlertMaxAgeMs,
            field: "alertMaxAgeMs",
            parser: positiveInt,
            selectFromConfig: (config: NotificationsConfig) => config.alertMaxAgeMs,
            setOverride: (overrides: NotificationsRuntimeOverrides, value) => {
                overrides.alertMaxAgeMs = value;
            },
            parseInput: (input) => positiveInt.optional().parse(input),
            serialize: (value) => value.toString(),
        }),
    ],
});
