import type { RuntimeSettings } from "../../config/runtimeConfig.js";
import type { SettingsRepo } from "../repos/settings.repo.js";
import { settingsRegistryEntries, settingsRegistryGroups } from "../registry/settings.registry.js";
import { loadParsedSettings } from "../pipeline/parse.js";
import { buildOverrides } from "../pipeline/overrides.js";
import type {
    AccessEventsRuntimeOverrides,
    MonitoringRuntimeOverrides,
    NotificationsRuntimeOverrides,
    OutboxRuntimeOverrides,
    RetentionRuntimeOverrides,
    WorkerRuntimeOverrides,
} from "../../config/runtimeConfig.js";

export function getRuntimeSettings(settingsRepo: SettingsRepo): RuntimeSettings {
    const parsed = loadParsedSettings(settingsRepo, settingsRegistryEntries);
    const overrides = buildOverrides(parsed, settingsRegistryGroups);
    return {
        worker: overrides.get("worker") as WorkerRuntimeOverrides,
        outbox: overrides.get("outbox") as OutboxRuntimeOverrides,
        accessEvents: overrides.get("accessEvents") as AccessEventsRuntimeOverrides,
        retention: overrides.get("retention") as RetentionRuntimeOverrides,
        monitoring: overrides.get("monitoring") as MonitoringRuntimeOverrides,
        notifications: overrides.get("notifications") as NotificationsRuntimeOverrides,
    };
}
