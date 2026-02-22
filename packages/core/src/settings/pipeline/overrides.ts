import type { SettingsRegistryEntry, SettingsRegistryGroup } from "../registry/settings.registry.js";
import type { ParsedSettingsMap, OverridesMap } from "./types.js";
import type { SettingEntryValue } from "../registry/types.js";

function getParsedValue<TEntry extends SettingsRegistryEntry>(
    parsed: ParsedSettingsMap,
    entry: TEntry
): SettingEntryValue<TEntry> | undefined {
    return parsed.get(entry.key)?.value as SettingEntryValue<TEntry> | undefined;
}

function applyOverride<TEntry extends SettingsRegistryEntry>(
    entry: TEntry,
    overrides: Parameters<TEntry["setOverride"]>[0],
    value: SettingEntryValue<TEntry>
) {
    entry.setOverride(overrides, value);
}

export function buildOverrides(
    parsed: ParsedSettingsMap,
    groups: readonly SettingsRegistryGroup[]
): OverridesMap {
    const overrides: OverridesMap = new Map();

    for (const group of groups) {
        const groupOverrides = group.createOverrides();
        overrides.set(group.name, groupOverrides);
        for (const entry of group.entries) {
            const value = getParsedValue(parsed, entry);
            if (value !== undefined) {
                applyOverride(entry, groupOverrides as Parameters<typeof entry.setOverride>[0], value);
            }
        }
    }

    return overrides;
}
