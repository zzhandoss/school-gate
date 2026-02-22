import { enqueueAuditRequested } from "../../audit/events/auditRequested.js";
import type { SettingWrite } from "../entities/setting.js";
import type { SettingsRepo } from "../repos/settings.repo.js";
import { InvalidSettingValueError } from "../../utils/index.js";
import { settingsRegistryGroups } from "../registry/settings.registry.js";
import type { SettingInput } from "../registry/types.js";
import type { IdGenerator } from "../../utils/common.types.js";
import type { OutboxRepo } from "../../ports/outbox.js";
import type { SetRuntimeSettingsClock, SetRuntimeSettingsInput, SetRuntimeSettingsResult } from "./settings.types.js";

function pushEntry(entries: SettingWrite[], key: string, value: string | undefined, updatedAt: Date) {
    if (value === undefined) return;
    entries.push({ key, value, updatedAt });
}

export function setRuntimeSettings(
    settingsRepo: SettingsRepo,
    clock: SetRuntimeSettingsClock,
    input: SetRuntimeSettingsInput,
    audit?: { outbox?: OutboxRepo | undefined; idGen?: IdGenerator | undefined; actorId?: string | undefined }
): SetRuntimeSettingsResult {
    const parsed = input;
    const updatedAt = clock.now();
    const entries: SettingWrite[] = [];

    for (const group of settingsRegistryGroups) {
        const inputGroup = parsed[group.name] as Record<string, SettingInput> | undefined;
        if (!inputGroup) continue;
        for (const entry of group.entries) {
            if (!entry.parseInput || !entry.serialize) continue;
            const rawValue = inputGroup[entry.field];
            if (rawValue === undefined) continue;
            try {
                const parsedValue = entry.parseInput(rawValue);
                if (parsedValue === undefined) continue;
                pushEntry(entries, entry.key, entry.serialize(parsedValue), updatedAt);
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error ?? "invalid value");
                throw new InvalidSettingValueError(entry.key, message);
            }
        }
    }

    settingsRepo.upsertManySync(entries);

    if (entries.length > 0 && audit?.outbox && audit.idGen) {
        enqueueAuditRequested({
            outbox: audit.outbox,
            id: audit.idGen.nextId(),
            actorId: audit.actorId ?? "system:runtime_settings",
            action: "runtime_settings_updated",
            entityType: "runtime_settings",
            entityId: "global",
            at: updatedAt,
            meta: {
                updated: entries.length,
                keys: entries.map((entry) => entry.key),
            },
        });
    }

    return { updated: entries.length };
}