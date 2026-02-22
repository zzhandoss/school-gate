import type { RuntimeConfigProvider } from "../../ports/index.js";
import type { SettingsRepo } from "../repos/settings.repo.js";
import type { RuntimeSettingsSnapshot } from "./settings.types.js";
import { settingsRegistryEntries, settingsRegistryGroups } from "../registry/settings.registry.js";
import { loadParsedSettings } from "../pipeline/parse.js";
import { buildOverrides } from "../pipeline/overrides.js";
import { buildSnapshot } from "../pipeline/snapshot.js";

export function listRuntimeSettingsSnapshot(
    settingsRepo: SettingsRepo,
    runtimeConfigProvider: RuntimeConfigProvider
): RuntimeSettingsSnapshot {
    const parsed = loadParsedSettings(settingsRepo, settingsRegistryEntries);
    const overrides = buildOverrides(parsed, settingsRegistryGroups);
    const snapshot = buildSnapshot(parsed, settingsRegistryGroups, runtimeConfigProvider, overrides);
    return snapshot as RuntimeSettingsSnapshot;
}
