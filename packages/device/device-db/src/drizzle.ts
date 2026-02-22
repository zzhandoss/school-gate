import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

export type DeviceDbClient = {
    sqlite: Database.Database;
    db: ReturnType<typeof drizzle>;
    close: () => void;
};

export function createDeviceDb(dbFilePath: string): DeviceDbClient {
    const sqlite = new Database(dbFilePath);

    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");

    const db = drizzle(sqlite);

    return {
        sqlite,
        db,
        close: () => sqlite.close()
    };
}

export type DeviceDb = ReturnType<typeof createDeviceDb>["db"];
