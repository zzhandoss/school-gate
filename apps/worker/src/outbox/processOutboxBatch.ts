import type { OutboxEventHandler } from "./types.js";
import type { NotificationSender } from "@school-gate/core";
import type { Db } from "@school-gate/db/drizzle";
import { createOutbox } from "@school-gate/infra";

export type ProcessBatchResult = {
    claimed: number;
    processed: number;
    failed: number;
};

export type ProcessOutputBatchInput = {
    limit: number;
    maxAttempts: number;
    leaseMs: number;
    processingBy: string;
    now: () => Date;
    newId: () => string;
    handlers: Record<string, OutboxEventHandler>;
    notificationSender?: NotificationSender | undefined;
    notificationFreshness?: {
        parentMaxAgeMs?: number | undefined;
        alertMaxAgeMs?: number | undefined;
    } | undefined;
};

export async function processOutboxBatch(
    db: Db,
    { limit, maxAttempts, leaseMs, processingBy, now, newId, handlers, notificationSender, notificationFreshness }: ProcessOutputBatchInput
): Promise<ProcessBatchResult> {
    const outbox = createOutbox(db);

    const claimed = db.transaction((tx) => {
        const outboxTx = createOutbox(tx as any);
        return outboxTx.claimBatch({ limit, now: now(), leaseMs, processingBy });
    });

    let processed = 0;
    let failed = 0;

    for (const event of claimed) {
        const handler = handlers[event.type];
        if (!handler) {
            outbox.markFailed(
                {
                    id: event.id,
                    error: `Unknown event type: ${event.type}`,
                    maxAttempts: maxAttempts
                });
            failed++;
            continue;
        }
        try {
            await handler(event, { db, now, newId, notificationSender, notificationFreshness });
            outbox.markProcessed({ id: event.id, processedAt: now() });
            processed++;
        } catch (e: any) {
            outbox.markFailed({ id: event.id, error: String(e?.message ?? e), maxAttempts: maxAttempts });
            failed++;
        }
    }

    return {
        claimed: claimed.length,
        processed: processed,
        failed: failed
    };
}
