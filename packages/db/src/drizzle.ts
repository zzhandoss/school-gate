import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

export type DbClient = {
    sqlite: Database.Database;
    db: ReturnType<typeof drizzle>;
    close: () => void;
}

export function createDb(dbFilePath: string): DbClient {
    const sqlite = new Database(dbFilePath);

    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");

    const db = drizzle(sqlite);

    return {
        sqlite,
        db,
        close: () => sqlite.close()
    }
}

export type Db = ReturnType<typeof createDb>["db"];
