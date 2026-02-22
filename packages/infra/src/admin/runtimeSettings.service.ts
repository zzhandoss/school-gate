import type { SetRuntimeSettingsInput } from "@school-gate/core";
import { createSettingsService } from "@school-gate/core";
import type { Db } from "@school-gate/db";
import { createRuntimeConfigProvider } from "../config/runtimeConfigProvider.js";
import { createSettingsRepo } from "../drizzle/repos/settings.repo.js";

export function createRuntimeSettingsService(db: Db) {
    const settingsRepo = createSettingsRepo(db);
    const runtimeConfigProvider = createRuntimeConfigProvider();
    const settingsService = createSettingsService({
        settingsRepo,
        runtimeConfigProvider,
        clock: { now: () => new Date() }
    });
    return {
        list: () => settingsService.listRuntimeSettingsSnapshot(),
        set: (input: SetRuntimeSettingsInput, adminId?: string | undefined) =>
            settingsService.setRuntimeSettings(input, { actorId: adminId })
    };
}
