import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { auditLogs } from "@school-gate/db/schema";
import type { AuditLogEntry, AuditLogsRepo } from "@school-gate/core";

function toDate(v: unknown): Date {
    return v instanceof Date ? v : new Date(String(v));
}

function parseMeta(value: string | null): Record<string, unknown> | null {
    if (!value) return null;
    try {
        return JSON.parse(value) as Record<string, unknown>;
    } catch {
        return null;
    }
}

export function createAuditLogsRepo(db: Db): AuditLogsRepo {
    return {
        async list({ limit, offset, actorId, action, entityType, entityId, from, to }) {
            const conditions: SQL[] = [];
            if (actorId) conditions.push(eq(auditLogs.actorId, actorId));
            if (action) conditions.push(eq(auditLogs.action, action));
            if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
            if (entityId) conditions.push(eq(auditLogs.entityId, entityId));
            if (from) conditions.push(gte(auditLogs.at, from));
            if (to) conditions.push(lte(auditLogs.at, to));

            const whereExpr = conditions.length > 0 ? and(...conditions) : undefined;

            const logsQuery = db
                .select()
                .from(auditLogs)
                .orderBy(desc(auditLogs.at))
                .limit(limit)
                .offset(offset);

            const totalQuery = db
                .select({ value: count() })
                .from(auditLogs);

            const [rows, totalRows] = await Promise.all([
                whereExpr ? logsQuery.where(whereExpr) : logsQuery,
                whereExpr ? totalQuery.where(whereExpr) : totalQuery
            ]);

            return {
                logs: rows.map((row) => ({
                    id: row.id,
                    eventId: row.eventId ?? null,
                    actorId: row.actorId,
                    action: row.action,
                    entityType: row.entityType,
                    entityId: row.entityId,
                    meta: parseMeta(row.metaJson ?? null),
                    at: toDate(row.at)
                })),
                page: {
                    limit,
                    offset,
                    total: totalRows[0]?.value ?? 0
                }
            };
        },
        async write(entry: AuditLogEntry): Promise<void> {
            await db.insert(auditLogs).values({
                id: entry.id,
                eventId: entry.eventId ?? null,
                actorId: entry.actorId,
                action: entry.action,
                entityType: entry.entityType,
                entityId: entry.entityId,
                metaJson: entry.meta ? JSON.stringify(entry.meta) : null,
                at: entry.at
            }).onConflictDoNothing({ target: auditLogs.eventId });
        },
        withTx(tx) {
            return createAuditLogsRepo(tx as Db);
        }

    };
}
