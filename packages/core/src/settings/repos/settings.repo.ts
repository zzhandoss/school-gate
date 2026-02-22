import type { SettingRow, SettingWrite } from "../entities/setting.js";

export type SettingsRepo = {
    getMany(keys: string[]): Promise<Map<string, SettingRow>>;
    getManySync(keys: string[]): Map<string, SettingRow>;
    upsertManySync(entries: SettingWrite[]): void;
    withTx(tx: unknown): SettingsRepo;
};

