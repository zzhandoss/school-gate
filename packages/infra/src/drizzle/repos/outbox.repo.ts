import { and, asc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { outboxEvents } from "@school-gate/db/schema";
import type { DomainEvent } from "@school-gate/core";
import type { OutboxRecord, Outbox } from "@school-gate/core";

export function createOutbox(db: Db): Outbox {
    return {
        enqueue(input: { id: string; event: DomainEvent }) {
            db.insert(outboxEvents).values({
                id: input.id,
                type: input.event.type,
                payloadJson: JSON.stringify(input.event.payload),
                status: "new",
                attempts: 0
            }).run();
        },

        claimBatch(input: { limit: number; now: Date; leaseMs: number; processingBy: string }): OutboxRecord[] {
            const reclaimBefore = new Date(input.now.getTime() - input.leaseMs);
            const eligible = or(
                eq(outboxEvents.status, "new"),
                and(
                    eq(outboxEvents.status, "processing"),
                    or(isNull(outboxEvents.processingAt), lt(outboxEvents.processingAt, reclaimBefore))
                )
            );

            const rows = db
                .select({
                    id: outboxEvents.id,
                    type: outboxEvents.type,
                    payloadJson: outboxEvents.payloadJson,
                    attempts: outboxEvents.attempts
                })
                .from(outboxEvents)
                .where(eligible)
                .orderBy(asc(outboxEvents.createdAt))
                .limit(input.limit)
                .all();

            if (rows.length === 0) return [];

            const ids = rows.map((r) => r.id);

            db
                .update(outboxEvents)
                .set({
                    status: "processing",
                    attempts: sql`${outboxEvents.attempts} + 1`,
                    processingAt: input.now,
                    processingBy: input.processingBy
                })
                .where(and(inArray(outboxEvents.id, ids), eligible))
                .run();

            return rows;
        },

        markProcessed(input: { id: string; processedAt: Date }) {
            db
                .update(outboxEvents)
                .set({
                    status: "processed",
                    processedAt: input.processedAt,
                    lastError: null
                })
                .where(eq(outboxEvents.id, input.id))
                .run();
        },

        markFailed(input: { id: string; error: string; maxAttempts: number }) {
            db
                .update(outboxEvents)
                .set({
                    status: sql`CASE WHEN ${outboxEvents.attempts} >= ${input.maxAttempts} THEN 'error' ELSE 'new' END`,
                    lastError: input.error,
                    processingAt: null,
                    processingBy: null
                })
                .where(eq(outboxEvents.id, input.id))
                .run();
        }
    };
}

