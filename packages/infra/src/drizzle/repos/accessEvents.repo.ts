import { and, asc, desc, eq, gte, inArray, isNull, like, lte, lt, or, sql } from "drizzle-orm";
import { accessEvents } from "@school-gate/db/schema";
import type { Db } from "@school-gate/db/drizzle";
import { AccessEvent, AccessEventsRepo } from "@school-gate/core";

function toDate(v: unknown): Date {
    // drizzle sqlite timestamp mode returns Date already, but пусть будет безопасно
    return v instanceof Date ? v : new Date(String(v));
}

export function createAccessEventsRepo(db: Db): AccessEventsRepo {
    function toAccessEvent(row: typeof accessEvents.$inferSelect): AccessEvent {
        return {
            ...row,
            occurredAt: toDate(row.occurredAt),
            nextAttemptAt: row.nextAttemptAt ? toDate(row.nextAttemptAt) : null,
            processedAt: row.processedAt ? toDate(row.processedAt) : null,
            createdAt: toDate(row.createdAt)
        } satisfies AccessEvent;
    }
    return {
        async insertIdempotent(input) {
            try {
                await db.insert(accessEvents).values({
                    id: input.id,
                    deviceId: input.deviceId,
                    direction: input.direction,
                    occurredAt: input.occurredAt,
                    iin: input.iin ?? null,
                    terminalPersonId: input.terminalPersonId ?? null,
                    idempotencyKey: input.idempotencyKey,
                    rawPayload: input.rawPayload ?? null,
                    status: input.status ?? "NEW"
                });
                return "inserted";
            } catch (e: any) {
                // SQLite unique constraint -> duplicate
                if (String(e?.message ?? "").toLowerCase().includes("unique")) return "duplicate";
                throw e;
            }
        },

        async listDueForProcessing({ limit, now }) {
            const rows = await db
                .select()
                .from(accessEvents)
                .where(
                    or(
                        eq(accessEvents.status, "NEW"),
                        and(eq(accessEvents.status, "FAILED_RETRY"), lte(accessEvents.nextAttemptAt, now))
                    )
                )
                .orderBy(accessEvents.occurredAt)
                .limit(limit);

            return rows.map(toAccessEvent);
        },

        async list(input) {
            const filters = [
                input.status ? eq(accessEvents.status, input.status) : undefined,
                input.direction ? eq(accessEvents.direction, input.direction) : undefined,
                input.deviceId ? eq(accessEvents.deviceId, input.deviceId) : undefined,
                input.iin ? like(accessEvents.iin, `%${input.iin}%`) : undefined,
                input.terminalPersonId ? like(accessEvents.terminalPersonId, `%${input.terminalPersonId}%`) : undefined,
                input.from ? gte(accessEvents.occurredAt, input.from) : undefined,
                input.to ? lte(accessEvents.occurredAt, input.to) : undefined
            ].filter(Boolean);

            const where = filters.length > 0 ? and(...filters) : undefined;
            const rows = await db
                .select()
                .from(accessEvents)
                .where(where)
                .orderBy(desc(accessEvents.occurredAt), desc(accessEvents.createdAt))
                .limit(input.limit)
                .offset(input.offset);
            const totalRows = await db
                .select({ count: sql<number>`count(*)` })
                .from(accessEvents)
                .where(where);

            return {
                events: rows.map(toAccessEvent),
                total: Number(totalRows[0]?.count ?? 0)
            };
        },

        async listUnmatched({ limit }) {
            const rows = await db
                .select()
                .from(accessEvents)
                .where(eq(accessEvents.status, "UNMATCHED"))
                .orderBy(accessEvents.occurredAt)
                .limit(limit);

            return rows.map(toAccessEvent);
        },

        async claimBatch({ limit, now, leaseMs, processingBy }) {
            const reclaimBefore = new Date(now.getTime() - leaseMs);
            const eligible = or(
                eq(accessEvents.status, "NEW"),
                and(eq(accessEvents.status, "FAILED_RETRY"), lte(accessEvents.nextAttemptAt, now)),
                and(
                    eq(accessEvents.status, "PROCESSING"),
                    or(isNull(accessEvents.processingAt), lt(accessEvents.processingAt, reclaimBefore))
                )
            );

            const rows = await db
                .select()
                .from(accessEvents)
                .where(eligible)
                .orderBy(asc(accessEvents.occurredAt))
                .limit(limit);

            if (rows.length === 0) return [];

            const ids = rows.map((r) => r.id);
            await db
                .update(accessEvents)
                .set({
                    status: "PROCESSING",
                    attempts: sql`${accessEvents.attempts} + 1`,
                    processingAt: now,
                    processingBy,
                })
                .where(and(inArray(accessEvents.id, ids), eligible));

            return rows.map(toAccessEvent);
        },

        async claimById({ id, now, leaseMs, processingBy }) {
            const reclaimBefore = new Date(now.getTime() - leaseMs);
            const eligible = and(
                eq(accessEvents.id, id),
                or(
                    eq(accessEvents.status, "NEW"),
                    and(eq(accessEvents.status, "FAILED_RETRY"), lte(accessEvents.nextAttemptAt, now)),
                    and(
                        eq(accessEvents.status, "PROCESSING"),
                        or(isNull(accessEvents.processingAt), lt(accessEvents.processingAt, reclaimBefore))
                    )
                )
            );

            const rows = await db.select().from(accessEvents).where(eligible).limit(1);
            const row = rows[0];
            if (!row) return null;

            await db
                .update(accessEvents)
                .set({
                    status: "PROCESSING",
                    attempts: sql`${accessEvents.attempts} + 1`,
                    processingAt: now,
                    processingBy,
                })
                .where(eligible);

            return {
                ...row,
                occurredAt: toDate(row.occurredAt),
                nextAttemptAt: row.nextAttemptAt ? toDate(row.nextAttemptAt) : null,
                processedAt: row.processedAt ? toDate(row.processedAt) : null,
                createdAt: toDate(row.createdAt)
            } satisfies AccessEvent;
        },

        async markProcessed({ id, processedAt }) {
            await db
                .update(accessEvents)
                .set({
                    status: "PROCESSED",
                    processedAt,
                    nextAttemptAt: null,
                    processingAt: null,
                    processingBy: null,
                    lastError: null,
                })
                .where(eq(accessEvents.id, id));
        },

        markProcessedSync({ id, processedAt }) {
            db
                .update(accessEvents)
                .set({
                    status: "PROCESSED",
                    processedAt,
                    nextAttemptAt: null,
                    processingAt: null,
                    processingBy: null,
                    lastError: null,
                })
                .where(eq(accessEvents.id, id))
                .run();
        },

        async markUnmatched({ id }) {
            await db.update(accessEvents).set({
                status: "UNMATCHED",
                processingAt: null,
                processingBy: null,
                nextAttemptAt: null,
                lastError: null,
            }).where(eq(accessEvents.id, id));
        },

        async markFailed({ id, error, attempts, maxAttempts, nextAttemptAt }) {
            const status = attempts >= maxAttempts ? "ERROR" : "FAILED_RETRY";
            const nextAttemptAtValue = status === "ERROR" ? null : nextAttemptAt;
            await db
                .update(accessEvents)
                .set({
                    status,
                    lastError: error,
                    nextAttemptAt: nextAttemptAtValue,
                    processingAt: null,
                    processingBy: null,
                })
                .where(eq(accessEvents.id, id));
        },

        async markReadyByTerminalIdentity({ deviceId, terminalPersonId }) {
            const rows = await db
                .select({ id: accessEvents.id })
                .from(accessEvents)
                .where(
                    and(
                        eq(accessEvents.status, "UNMATCHED"),
                        eq(accessEvents.deviceId, deviceId),
                        eq(accessEvents.terminalPersonId, terminalPersonId)
                    )
                );

            if (rows.length === 0) return 0;

            await db
                .update(accessEvents)
                .set({
                    status: "NEW",
                    attempts: 0,
                    nextAttemptAt: null,
                    processingAt: null,
                    processingBy: null,
                    lastError: null,
                })
                .where(
                    and(
                        eq(accessEvents.status, "UNMATCHED"),
                        eq(accessEvents.deviceId, deviceId),
                        eq(accessEvents.terminalPersonId, terminalPersonId)
                    )
                );

            return rows.length;
        },

        async deleteOlderThan({ before }) {
            const rows = await db
                .select({ id: accessEvents.id })
                .from(accessEvents)
                .where(lte(accessEvents.occurredAt, before));

            if (rows.length === 0) return 0;

            await db.delete(accessEvents).where(lte(accessEvents.occurredAt, before));
            return rows.length;
        },

        withTx(tx) {
            return createAccessEventsRepo(tx as Db);
        },

    };
}


