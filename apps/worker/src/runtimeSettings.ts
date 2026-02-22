import type { Db } from "@school-gate/db/drizzle";
import { type Clock, createSettingsService } from "@school-gate/core";
import { createRuntimeConfigProvider, createSettingsRepo } from "@school-gate/infra";

export function loadRuntimeSettings(db: Db, clock: Clock) {
    const settingsRepo = createSettingsRepo(db);
    const settingsService = createSettingsService({
        settingsRepo: settingsRepo,
        runtimeConfigProvider: createRuntimeConfigProvider(),
        clock: clock
    });
    return settingsService.getRuntimeSettings();
}

