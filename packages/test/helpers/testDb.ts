import { mkdtempSync, rmSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import type { Db } from "@school-gate/db/drizzle";
import { createDb } from "@school-gate/db/drizzle";

export type TestDb = {
    db: Db;
    dbFile: string;
    cleanup: () => void;
};

const currentDir = dirname(fileURLToPath(import.meta.url));
const coreMigrationsDir = resolve(currentDir, "..", "..", "db", "src", "migrations");

function applyCoreMigrations(dbFile: string) {
    const sqlite = new Database(dbFile);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");

    const migrationFiles = readdirSync(coreMigrationsDir)
        .filter((name) => name.endsWith(".sql"))
        .sort((a, b) => a.localeCompare(b));

    for (const fileName of migrationFiles) {
        const sql = readFileSync(resolve(coreMigrationsDir, fileName), "utf8");
        sqlite.exec(sql);
    }

    sqlite.close();
}

export function createTestDb(): TestDb {
    const dir = mkdtempSync(join(tmpdir(), "schoolgate-"));
    const dataDir = join(dir, "data");
    mkdirSync(dataDir, { recursive: true });

    const dbFile = join(dataDir, "test.db");

    applyCoreMigrations(dbFile);

    const client = createDb(dbFile);

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
                    // небольшой busy-wait (без async)
                    const start = Date.now();
                    while (Date.now() - start < 30) {}
                }
            }

            rmSync(dir, { recursive: true, force: true });
        }
    };
}

