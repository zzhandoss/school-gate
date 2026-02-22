import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { alertEvents } from "@school-gate/db/schema";
import type { AlertEventsRepo, AlertEvent } from "@school-gate/core";

function toDate(value: unknown): Date {
    return value instanceof Date ? value : new Date(String(value));
}

function parseDetails(raw: string | null): AlertEvent["details"] {
    if (!raw) return null;
    return JSON.parse(raw) as AlertEvent["details"];
}

function mapEvent(row: typeof alertEvents.$inferSelect): AlertEvent {
    return {
        id: row.id,
        ruleId: row.ruleId,
        snapshotId: row.snapshotId ?? null,
        status: row.status as AlertEvent["status"],
        severity: row.severity as AlertEvent["severity"],
        message: row.message,
        details: parseDetails(row.detailsJson ?? null),
        createdAt: toDate(row.createdAt)
    };
}

export function createAlertEventsRepo(db: Db): AlertEventsRepo {
    return {
        insertSync(input) {
            db.insert(alertEvents)
                .values({
                    id: input.id,
                    ruleId: input.ruleId,
                    snapshotId: input.snapshotId,
                    status: input.status,
                    severity: input.severity,
                    message: input.message,
                    detailsJson: input.details ? JSON.stringify(input.details) : null,
                    createdAt: input.createdAt
                })
                .run();
        },

        async list(input) {
            const conditions = [];
            if (input.ruleId) conditions.push(eq(alertEvents.ruleId, input.ruleId));
            if (input.status) conditions.push(eq(alertEvents.status, input.status));
            if (input.from) conditions.push(gte(alertEvents.createdAt, input.from));
            if (input.to) conditions.push(lte(alertEvents.createdAt, input.to));

            const query = conditions.length
                ? db.select().from(alertEvents).where(and(...conditions))
                : db.select().from(alertEvents);

            const rows = query
                .orderBy(desc(alertEvents.createdAt))
                .limit(input.limit)
                .offset(input.offset)
                .all();
            return rows.map(mapEvent);
        },

        async listLatestByRuleIds(input) {
            if (input.ruleIds.length === 0) return [];
            const rows = db
                .select()
                .from(alertEvents)
                .where(inArray(alertEvents.ruleId, input.ruleIds))
                .orderBy(desc(alertEvents.createdAt))
                .all();

            const seen = new Set<string>();
            const latest: AlertEvent[] = [];
            for (const row of rows) {
                if (seen.has(row.ruleId)) continue;
                seen.add(row.ruleId);
                latest.push(mapEvent(row));
            }
            return latest;
        },
        withTx(tx) {
            return createAlertEventsRepo(tx as Db);
        }

    };
}

