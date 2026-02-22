import type {
    SettingsGroup,
    SettingsRegistry,
    SettingsRegistryEntry,
} from "../registry/settings.registry.js";
import type { SettingEntryValue } from "../registry/types.js";

export type ParsedSetting<T> = {
    key: string;
    value?: T;
    updatedAt?: Date;
};

export type SettingValue = SettingEntryValue<SettingsRegistryEntry>;

export type ParsedSettingsMap = Map<string, ParsedSetting<SettingValue>>;

export type OverridesByGroup = {
    [Group in SettingsGroup]: ReturnType<SettingsRegistry[Group]["createOverrides"]>;
};

export type OverridesMap = Map<SettingsGroup, OverridesByGroup[SettingsGroup]>;
