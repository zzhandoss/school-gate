import type Database from "better-sqlite3";

export type StoredAdapterEvent = {
    id: number;
    eventId: string;
    deviceId: string;
    direction: "IN" | "OUT";
    occurredAt: number;
    terminalPersonId: string | null;
    rawPayload: string | null;
    createdAt: number;
    sentAt: number | null;
};

type AdapterEventRow = {
    id: number;
    event_id: string;
    device_id: string;
    direction: "IN" | "OUT";
    occurred_at: number;
    terminal_person_id: string | null;
    raw_payload: string | null;
    created_at: number;
    sent_at: number | null;
};

export type NewAdapterEvent = {
    eventId: string;
    deviceId: string;
    direction: "IN" | "OUT";
    occurredAt: number;
    terminalPersonId?: string | null;
    rawPayload?: string | null;
};

function mapRow(row: AdapterEventRow): StoredAdapterEvent {
    return {
        id: row.id,
        eventId: row.event_id,
        deviceId: row.device_id,
        direction: row.direction,
        occurredAt: row.occurred_at,
        terminalPersonId: row.terminal_person_id,
        rawPayload: row.raw_payload,
        createdAt: row.created_at,
        sentAt: row.sent_at
    } as const;
}

function buildPlaceholders(count: number): string {
    return Array.from({ length: count }, () => "?").join(", ");
}

export function createAdapterEventsRepo(db: Database.Database) {
    const insertStmt = db.prepare(
        "INSERT INTO adapter_events (event_id, device_id, direction, occurred_at, terminal_person_id, raw_payload, created_at, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const listUnsentStmt = db.prepare<any, AdapterEventRow>(
        "SELECT id, event_id, device_id, direction, occurred_at, terminal_person_id, raw_payload, created_at, sent_at FROM adapter_events WHERE sent_at IS NULL ORDER BY id LIMIT ?"
    );
    const findIdStmt = db.prepare("SELECT id FROM adapter_events WHERE event_id = ? AND device_id = ?");
    const listBackfillFromStartStmt = db.prepare<[...any], AdapterEventRow>(
        "SELECT id, event_id, device_id, direction, occurred_at, terminal_person_id, raw_payload, created_at, sent_at FROM adapter_events WHERE device_id = ? ORDER BY id LIMIT ?"
    );
    const listBackfillSinceStmt = db.prepare<[...any], AdapterEventRow>(
        "SELECT id, event_id, device_id, direction, occurred_at, terminal_person_id, raw_payload, created_at, sent_at FROM adapter_events WHERE device_id = ? AND id > ? ORDER BY id LIMIT ?"
    );
    const deleteOlderStmt = db.prepare("DELETE FROM adapter_events WHERE occurred_at < ?");

    return {
        insert(event: NewAdapterEvent) {
            const now = Date.now();
            const result = insertStmt.run(
                event.eventId,
                event.deviceId,
                event.direction,
                event.occurredAt,
                event.terminalPersonId ?? null,
                event.rawPayload ?? null,
                now,
                null
            );
            return {
                id: Number(result.lastInsertRowid),
                eventId: event.eventId
            };
        },
        listUnsent(limit: number): StoredAdapterEvent[] {
            return listUnsentStmt.all(limit).map(mapRow);
        },
        listUnsentForDevices(deviceIds: string[], limit: number): StoredAdapterEvent[] {
            if (deviceIds.length === 0) return [];
            const placeholders = buildPlaceholders(deviceIds.length);
            const stmt = db.prepare<[...any], AdapterEventRow>(
                `SELECT id, event_id, device_id, direction, occurred_at, terminal_person_id, raw_payload, created_at, sent_at FROM adapter_events WHERE sent_at IS NULL AND device_id IN (${placeholders}) ORDER BY id LIMIT ?`
            );
            return stmt.all(...deviceIds, limit).map(mapRow);
        },
        markSent(eventIds: string[], sentAt: number) {
            if (eventIds.length === 0) return { updated: 0 };
            const placeholders = buildPlaceholders(eventIds.length);
            const stmt = db.prepare(`UPDATE adapter_events SET sent_at = ? WHERE event_id IN (${placeholders})`);
            const result = stmt.run(sentAt, ...eventIds);
            return { updated: result.changes };
        },
        listBackfill(deviceId: string, sinceEventId: string | null | undefined, limit: number): StoredAdapterEvent[] {
            if (!sinceEventId) {
                return listBackfillFromStartStmt.all(deviceId, limit).map(mapRow);
            }

            const row = findIdStmt.get(sinceEventId, deviceId) as { id: number } | undefined;
            if (!row) {
                return listBackfillFromStartStmt.all(deviceId, limit).map(mapRow);
            }

            return listBackfillSinceStmt.all(deviceId, row.id, limit).map(mapRow);
        },
        deleteOlderThan(cutoffMs: number) {
            const result = deleteOlderStmt.run(cutoffMs);
            return { deleted: result.changes };
        }
    };
}
