import type { RuntimeConfigProvider } from "../../ports/index.js";
import type { RuntimeSettingField } from "../services/settings.types.js";
import type { SettingsGroup, SettingsRegistryGroup } from "../registry/settings.registry.js";
import type { ParsedSetting, ParsedSettingsMap, OverridesMap, SettingValue } from "./types.js";
import type { SettingEntryValue } from "../registry/types.js";

function buildField<T>(key: string, envValue: T, effectiveValue: T, parsed: ParsedSetting<T>): RuntimeSettingField<T> {
    const field: RuntimeSettingField<T> = {
        key,
        env: envValue,
        effective: effectiveValue
    };
    if (parsed.value !== undefined) {
        field.db = parsed.value;
        if (parsed.updatedAt !== undefined) {
            field.updatedAt = parsed.updatedAt;
        }
    }
    return field;
}

function buildGroupSnapshot(
    group: SettingsRegistryGroup,
    parsed: ParsedSettingsMap,
    provider: RuntimeConfigProvider,
    overrides: OverridesMap
) {
    const envConfig = group.getEnvConfig(provider);
    const groupOverrides = overrides.get(group.name) ?? group.createOverrides();
    const effectiveConfig = group.applyOverrides(
        provider,
        groupOverrides as Parameters<typeof group.applyOverrides>[1]
    );
    const snapshot: Record<string, RuntimeSettingField<SettingValue>> = {};

    for (const entry of group.entries) {
        const parsedEntry = parsed.get(entry.key);
        const parsedValue = (parsedEntry ?? { key: entry.key }) as ParsedSetting<
            SettingEntryValue<typeof entry>
        >;
        const selectFromConfig = entry.selectFromConfig as (
            config: typeof envConfig
        ) => SettingEntryValue<typeof entry>;
        const envValue = selectFromConfig(envConfig);
        const effectiveValue = selectFromConfig(effectiveConfig);
        snapshot[entry.field] = buildField(entry.key, envValue, effectiveValue, parsedValue);
    }

    return snapshot;
}

export function buildSnapshot(
    parsed: ParsedSettingsMap,
    groups: readonly SettingsRegistryGroup[],
    provider: RuntimeConfigProvider,
    overrides: OverridesMap
): Record<SettingsGroup, Record<string, RuntimeSettingField<SettingValue>>> {
    const snapshot: Record<SettingsGroup, Record<string, RuntimeSettingField<SettingValue>>> = {} as Record<
        SettingsGroup,
        Record<string, RuntimeSettingField<SettingValue>>
    >;

    for (const group of groups) {
        const groupSnapshot = buildGroupSnapshot(group, parsed, provider, overrides);
        snapshot[group.name] = groupSnapshot;
    }

    return snapshot;
}
