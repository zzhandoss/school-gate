import type { OutboxRepo } from "../../ports/outbox.js";
import { DomainEvents } from "../../events/domain.js";

type AuditMeta = Record<string, unknown> | undefined;

type EnqueueAuditRequestedInput = {
    outbox: OutboxRepo;
    id: string;
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    at: Date | string;
    meta?: AuditMeta;
};

export function enqueueAuditRequested(input: EnqueueAuditRequestedInput): void {
    const at = typeof input.at === "string" ? input.at : input.at.toISOString();
    input.outbox.enqueue({
        id: input.id,
        event: {
            type: DomainEvents.AUDIT_REQUESTED,
            payload: {
                actorId: input.actorId,
                action: input.action,
                entityType: input.entityType,
                entityId: input.entityId,
                at,
                meta: input.meta,
            },
        },
    });
}

