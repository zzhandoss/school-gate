import type { OutboxEventHandler, OutboxEventRecord, OutboxHandlersDeps } from "../types.js";
import crypto from "node:crypto";
import { type AuditLogEntry } from "@school-gate/core";
import { createAuditor } from "@school-gate/infra";
import { DomainEvents } from "@school-gate/core";

export const auditRequestedHandler: OutboxEventHandler = async (event: OutboxEventRecord, deps: OutboxHandlersDeps) => {
    const auditor = createAuditor(deps.db);

    const payload = JSON.parse(event.payloadJson) satisfies Omit<AuditLogEntry, "id">;
    await auditor.write({
        id: crypto.randomUUID(),
        eventId: event.id,
        ...payload,
        at: new Date(payload.at)
    });
};

export const auditRequestedHandlerType = DomainEvents.AUDIT_REQUESTED;
