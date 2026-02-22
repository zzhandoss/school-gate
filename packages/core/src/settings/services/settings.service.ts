import type { SettingsService, SettingsServiceDeps } from "./settings.types.js";
import { getRuntimeSettings } from "./getRuntimeSettings.js";
import { listRuntimeSettingsSnapshot } from "./listRuntimeSettingsSnapshot.js";
import { setRuntimeSettings } from "./setRuntimeSettings.js";

export function createSettingsService(deps: SettingsServiceDeps): SettingsService {
    return {
        withTx(tx: unknown) {
            return createSettingsService({
                ...deps,
                settingsRepo: deps.settingsRepo.withTx(tx)
            });
        },



        getRuntimeSettings() {
            return getRuntimeSettings(deps.settingsRepo);
        },
        listRuntimeSettingsSnapshot() {
            return listRuntimeSettingsSnapshot(deps.settingsRepo, deps.runtimeConfigProvider);
        },
        setRuntimeSettings(input, options) {
            return setRuntimeSettings(deps.settingsRepo, deps.clock, input, {
                outbox: deps.outbox,
                idGen: deps.idGen,
                actorId: options?.actorId
            });
        }
    };
}