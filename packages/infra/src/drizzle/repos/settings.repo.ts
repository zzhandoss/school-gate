import { inArray } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { settings as settingsTable } from "@school-gate/db/schema";
import type { SettingRow, SettingsRepo, SettingWrite } from "@school-gate/core";

function toDate(value: unknown): Date {
    return value instanceof Date ? value : new Date(String(value));
}

function mapRow(row: any): SettingRow {
    return {
        key: row.key,
        value: row.value,
        updatedAt: toDate(row.updatedAt)
    };
}

export function createSettingsRepo(db: Db): SettingsRepo {
    return {
        async getMany(keys) {
            return this.getManySync(keys);
        },

        getManySync(keys) {
            if (keys.length === 0) {
                return new Map<string, SettingRow>();
            }

            const rows = db
                .select()
                .from(settingsTable)
                .where(inArray(settingsTable.key, keys))
                .all();

            const map = new Map<string, SettingRow>();
            for (const row of rows) {
                const mapped = mapRow(row);
                map.set(mapped.key, mapped);
            }
            return map;
        },

        upsertManySync(entries: SettingWrite[]) {
            if (entries.length === 0) return;
            db.transaction((tx) => {
                for (const entry of entries) {
                    tx
                        .insert(settingsTable)
                        .values({
                            key: entry.key,
                            value: entry.value,
                            updatedAt: entry.updatedAt
                        })
                        .onConflictDoUpdate({
                            target: settingsTable.key,
                            set: {
                                value: entry.value,
                                updatedAt: entry.updatedAt
                            }
                        })
                        .run();
                }
            });
        },

        withTx(tx) {
            return createSettingsRepo(tx as Db);
        }

    };
}

