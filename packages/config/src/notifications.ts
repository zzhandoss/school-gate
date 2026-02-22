import { z } from "zod";
import { parseEnv } from "./parseEnv.js";
import type { NotificationsConfig, NotificationsRuntimeOverrides } from "@school-gate/core";

const notificationsSchema = z.object({
    NOTIFICATIONS_PARENT_TEMPLATE: z
        .string()
        .min(1)
        .default("{{firstName}} {{lastName}} {{directionWord}} школу. Время: {{time}}"),
    NOTIFICATIONS_PARENT_MAX_AGE_MS: z.coerce.number().int().positive().default(600_000),
    NOTIFICATIONS_ALERT_MAX_AGE_MS: z.coerce.number().int().positive().default(300_000)
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

export function getNotificationsConfig(overrides?: NotificationsRuntimeOverrides): NotificationsConfig {
    const parsed = parseEnv(notificationsSchema, "notifications");
    const base: NotificationsConfig = {
        parentTemplate: parsed.NOTIFICATIONS_PARENT_TEMPLATE,
        parentMaxAgeMs: parsed.NOTIFICATIONS_PARENT_MAX_AGE_MS,
        alertMaxAgeMs: parsed.NOTIFICATIONS_ALERT_MAX_AGE_MS
    };
    return applyOverrides(base, overrides);
}
