import { mkdtempSync, rmSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { createDeviceDb, DeviceDb } from "@school-gate/device/device-db/drizzle";

export type DeviceTestDb = {
    db: DeviceDb;
    dbFile: string;
    cleanup: () => void;
};

const currentDir = dirname(fileURLToPath(import.meta.url));
const deviceMigrationsDir = resolve(currentDir, "../../device/device-db/src/migrations");

function applyDeviceMigrations(dbFile: string) {
    const sqlite = new Database(dbFile);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");

    const migrationFiles = readdirSync(deviceMigrationsDir)
        .filter((name) => name.endsWith(".sql"))
        .sort((a, b) => a.localeCompare(b));

    for (const fileName of migrationFiles) {
        const sql = readFileSync(resolve(deviceMigrationsDir, fileName), "utf8");
        sqlite.exec(sql);
    }

    sqlite.close();
}

export function createDeviceTestDb(): DeviceTestDb {
    const dir = mkdtempSync(join(tmpdir(), "schoolgate-device-"));
    const dataDir = join(dir, "data");
    mkdirSync(dataDir, { recursive: true });

    const dbFile = join(dataDir, "device.db");

    applyDeviceMigrations(dbFile);

    const client = createDeviceDb(dbFile);

    return {
        db: client.db,
        dbFile,
        cleanup: () => {
            client.close();

            for (let i = 0; i < 5; i++) {
                try {
                    rmSync(dir, { recursive: true, force: true });
                    return;
                } catch (e: any) {
                    if (String(e?.code) !== "EBUSY") throw e;
                    const start = Date.now();
                    while (Date.now() - start < 30) {}
                }
            }

            rmSync(dir, { recursive: true, force: true });
        },
    };
}

