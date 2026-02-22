import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const schema = `
CREATE TABLE IF NOT EXISTS adapter_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL UNIQUE,
    device_id TEXT NOT NULL,
    direction TEXT NOT NULL,
    occurred_at INTEGER NOT NULL,
    terminal_person_id TEXT NULL,
    raw_payload TEXT NULL,
    created_at INTEGER NOT NULL,
    sent_at INTEGER NULL
);

CREATE INDEX IF NOT EXISTS adapter_events_device_idx ON adapter_events(device_id);
CREATE INDEX IF NOT EXISTS adapter_events_sent_idx ON adapter_events(sent_at);

CREATE TABLE IF NOT EXISTS adapter_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
`;

export type AdapterDb = {
    db: Database.Database;
    getMeta: (key: string) => string | null;
    setMeta: (key: string, value: string) => void;
    close: () => void;
};

function ensureDir(filePath: string) {
    const dir = path.dirname(filePath);
    if (!dir || dir === ".") return;
    if (fs.existsSync(dir)) return;
    fs.mkdirSync(dir, { recursive: true });
}

export function createAdapterDb(filePath: string): AdapterDb {
    if (filePath !== ":memory:") {
        ensureDir(filePath);
    }

    const db = new Database(filePath);
    db.pragma("journal_mode = WAL");
    db.exec(schema);
    const getMetaStmt = db.prepare<[string], { value: string }>("SELECT value FROM adapter_meta WHERE key = ?");
    const setMetaStmt = db.prepare("INSERT INTO adapter_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");

    return {
        db,
        getMeta: (key) => {
            const row = getMetaStmt.get(key);
            return row?.value ?? null;
        },
        setMeta: (key, value) => {
            setMetaStmt.run(key, value);
        },
        close: () => db.close()
    };
}
