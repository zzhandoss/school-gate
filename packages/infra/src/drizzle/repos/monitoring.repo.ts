import { and, asc, desc, inArray, isNotNull, min, sql } from "drizzle-orm";
import type { Db } from "@school-gate/db";
import { accessEvents, outboxEvents, workerHeartbeats } from "@school-gate/db/schema";
import type {
    AccessEventsStatusCounts,
    ErrorStat,
    MonitoringRepo,
    OutboxStatus,
    OutboxStatusCounts,
    WorkerHeartbeat, WorkerHeartbeatMeta,
} from "@school-gate/core";
import { AccessEventStatus } from "@school-gate/core";

const accessEventStatuses: AccessEventStatus[] = [
    "NEW",
    "PROCESSING",
    "PROCESSED",
    "FAILED_RETRY",
    "UNMATCHED",
    "ERROR",
];

const outboxStatuses: OutboxStatus[] = ["new", "processing", "processed", "error"];

function toDate(value: unknown): Date | null {
    if (value == null) return null;
    if (value instanceof Date) return value;
    if (typeof value === "number") {
        const ms = value < 1_000_000_000_000 ? value * 1000 : value;
        return new Date(ms);
    }
    if (typeof value === "string") {
        const asNumber = Number(value);
        if (Number.isFinite(asNumber)) {
            const ms = asNumber < 1_000_000_000_000 ? asNumber * 1000 : asNumber;
            return new Date(ms);
        }
        return new Date(value);
    }
    return new Date(String(value));
}

function emptyAccessCounts(): AccessEventsStatusCounts {
    return accessEventStatuses.reduce(
        (acc, status) => {
            acc[status] = 0;
            return acc;
        },
        {} as AccessEventsStatusCounts
    );
}

function emptyOutboxCounts(): OutboxStatusCounts {
    return outboxStatuses.reduce(
        (acc, status) => {
            acc[status] = 0;
            return acc;
        },
        {} as OutboxStatusCounts
    );
}

function parseMeta(metaJson: string | null): WorkerHeartbeatMeta | null {
    if (!metaJson) return null;
    try {
        const parsed = JSON.parse(metaJson);
        if (parsed && typeof parsed === "object") {
            return parsed as WorkerHeartbeatMeta;
        }
        return { note: "meta_json_not_object" };
    } catch {
        return { note: "meta_json_parse_failed" };
    }
}

export function createMonitoringRepo(db: Db): MonitoringRepo {
    return {
        async getAccessEventsStatusCounts() {
            const rows = await db
                .select({
                    status: accessEvents.status,
                    count: sql<number>`count(*)`,
                })
                .from(accessEvents)
                .groupBy(accessEvents.status);

            const counts = emptyAccessCounts();
            for (const row of rows) {
                const status = row.status as AccessEventStatus;
                counts[status] = Number(row.count);
            }
            return counts;
        },

        async getOldestAccessEventsOccurredAt(statuses) {
            if (statuses.length === 0) return null;
            const rows = await db
                .select({
                    value: min(accessEvents.occurredAt),
                })
                .from(accessEvents)
                .where(inArray(accessEvents.status, statuses))
                .orderBy(asc(accessEvents.occurredAt))
                .limit(1);

            return toDate(rows[0]?.value ?? null);
        },

        async getOutboxStatusCounts() {
            const rows = await db
                .select({
                    status: outboxEvents.status,
                    count: sql<number>`count(*)`,
                })
                .from(outboxEvents)
                .groupBy(outboxEvents.status);

            const counts = emptyOutboxCounts();
            for (const row of rows) {
                const status = row.status as OutboxStatus;
                counts[status] = Number(row.count);
            }
            return counts;
        },

        async getOldestOutboxCreatedAt(statuses) {
            if (statuses.length === 0) return null;
            const rows = await db
                .select({
                    value: min(outboxEvents.createdAt),
                })
                .from(outboxEvents)
                .where(inArray(outboxEvents.status, statuses))
                .orderBy(asc(outboxEvents.createdAt))
                .limit(1);

            return toDate(rows[0]?.value ?? null);
        },

        async listWorkerHeartbeats() {
            const rows = await db
                .select()
                .from(workerHeartbeats)
                .orderBy(asc(workerHeartbeats.workerId));

            return rows.map((row) => ({
                workerId: row.workerId,
                updatedAt: toDate(row.updatedAt) ?? new Date(0),
                lastStartedAt: toDate(row.lastStartedAt),
                lastSuccessAt: toDate(row.lastSuccessAt),
                lastErrorAt: toDate(row.lastErrorAt),
                lastError: row.lastError ?? null,
                meta: parseMeta(row.metaJson ?? null),
            })) satisfies WorkerHeartbeat[];
        },

        async getTopAccessEventErrors(limit) {
            const lastAtExpr = sql`max(coalesce(${accessEvents.processingAt}, ${accessEvents.nextAttemptAt}, ${accessEvents.occurredAt}, ${accessEvents.createdAt}))`;
            const rows = await db
                .select({
                    error: accessEvents.lastError,
                    count: sql<number>`count(*)`,
                    lastAt: lastAtExpr,
                })
                .from(accessEvents)
                .where(and(inArray(accessEvents.status, ["ERROR", "FAILED_RETRY"]), isNotNull(accessEvents.lastError)))
                .groupBy(accessEvents.lastError)
                .orderBy(desc(sql`count(*)`))
                .limit(limit);

            return rows.map((row) => ({
                error: String(row.error),
                count: Number(row.count),
                lastAt: toDate(row.lastAt),
            })) satisfies ErrorStat[];
        },

        async getTopOutboxErrors(limit) {
            const lastAtExpr = sql`max(coalesce(${outboxEvents.processingAt}, ${outboxEvents.createdAt}))`;
            const rows = await db
                .select({
                    error: outboxEvents.lastError,
                    count: sql<number>`count(*)`,
                    lastAt: lastAtExpr,
                })
                .from(outboxEvents)
                .where(and(inArray(outboxEvents.status, ["error"]), isNotNull(outboxEvents.lastError)))
                .groupBy(outboxEvents.lastError)
                .orderBy(desc(sql`count(*)`))
                .limit(limit);

            return rows.map((row) => ({
                error: String(row.error),
                count: Number(row.count),
                lastAt: toDate(row.lastAt),
            })) satisfies ErrorStat[];
        },
        withTx(tx) {
            return createMonitoringRepo(tx as Db);
        },

    };
}

