import { InvalidSettingValueError } from "../../utils/index.js";
import type { SettingsRepo } from "../repos/settings.repo.js";
import type { SettingsRegistryEntry } from "../registry/settings.registry.js";
import type { ParsedSetting, ParsedSettingsMap, SettingValue } from "./types.js";

export function parseRows(
    rows: Map<string, { value: string; updatedAt: Date }>,
    entries: readonly SettingsRegistryEntry[]
): ParsedSettingsMap {
    const parsed: ParsedSettingsMap = new Map();

    for (const entry of entries) {
        const row = rows.get(entry.key);
        if (!row) {
            parsed.set(entry.key, { key: entry.key });
            continue;
        }

        const result = entry.parser.safeParse(row.value);
        if (!result.success) {
            const issue = result.error.issues[0];
            throw new InvalidSettingValueError(entry.key, issue?.message ?? "unknown error");
        }

        const value: ParsedSetting<SettingValue> = {
            key: entry.key,
            value: result.data,
            updatedAt: row.updatedAt
        };
        parsed.set(entry.key, value);
    }

    return parsed;
}

export function loadParsedSettings(
    settingsRepo: SettingsRepo,
    entries: readonly SettingsRegistryEntry[]
): ParsedSettingsMap {
    const rows = settingsRepo.getManySync(entries.map((entry) => entry.key));
    return parseRows(rows, entries);
}
