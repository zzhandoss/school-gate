import type { z } from "zod";
import type { RuntimeConfigProvider } from "../../ports/runtimeConfigProvider.js";

export type SettingEntry<TConfig, TOverrides, TValue> = {
    key: string;
    field: string;
    parser: z.ZodType<TValue>;
    selectFromConfig(config: TConfig): TValue;
    setOverride(overrides: TOverrides, value: TValue): void;
    parseInput?(input: SettingInput): TValue | undefined;
    serialize?(value: TValue): string;
};

export type GroupRegistry<TGroup extends string, TConfig, TOverrides, TValue> = {
    name: TGroup;
    getEnvConfig(provider: RuntimeConfigProvider): TConfig;
    applyOverrides(provider: RuntimeConfigProvider, overrides: TOverrides): TConfig;
    createOverrides(): TOverrides;
    entries: readonly SettingEntry<TConfig, TOverrides, TValue>[];
};

export type SettingEntryValue<TEntry> = TEntry extends SettingEntry<
    infer _Config,
    infer _Overrides,
    infer TValue
>
    ? TValue
    : never;

export type SettingInput = string | number | boolean | null;

export function defineSettingEntry<TConfig, TOverrides, TValue>(entry: {
    key: string;
    field: string;
    parser: z.ZodType<TValue>;
    selectFromConfig(config: TConfig): TValue;
    setOverride(overrides: TOverrides, value: TValue): void;
    parseInput?(input: SettingInput): TValue | undefined;
    serialize?(value: TValue): string;
}): SettingEntry<TConfig, TOverrides, TValue> {
    return entry;
}

export function defineGroupRegistry<
    TGroup extends string,
    TConfig,
    TOverrides,
    TEntryValue,
    TEntries extends readonly SettingEntry<TConfig, TOverrides, TEntryValue>[]
>(registry: {
    name: TGroup;
    getEnvConfig(provider: RuntimeConfigProvider): TConfig;
    applyOverrides(provider: RuntimeConfigProvider, overrides: TOverrides): TConfig;
    createOverrides(): TOverrides;
    entries: TEntries;
}): GroupRegistry<TGroup, TConfig, TOverrides, TEntryValue> {
    return registry;
}
