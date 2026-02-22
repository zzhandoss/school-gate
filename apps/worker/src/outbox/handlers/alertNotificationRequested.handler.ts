import type { OutboxEventHandler, OutboxEventRecord, OutboxHandlersDeps } from "../types.js";
import type { AlertNotification } from "@school-gate/core";
import { DomainEvents } from "@school-gate/core";
import { createOutbox } from "@school-gate/infra";
import { computeAgeMs, isStaleByAge, parseIsoOrThrow } from "../freshness.js";

export const alertNotificationRequestedHandler: OutboxEventHandler = async (
    event: OutboxEventRecord,
    deps: OutboxHandlersDeps
) => {
    if (!deps.notificationSender) {
        throw new Error("Notification sender not configured");
    }

    const payload = JSON.parse(event.payloadJson) satisfies AlertNotification;
    const sourceTime = parseIsoOrThrow(payload.createdAt);
    const ageMs = computeAgeMs({ now: deps.now(), sourceTime });
    const maxAgeMs = deps.notificationFreshness?.alertMaxAgeMs;
    const isStale = isStaleByAge({ ageMs, maxAgeMs });
    if (isStale) {
        if (!deps.db) {
            throw new Error("DB is required for stale notification audit");
        }
        createOutbox(deps.db).enqueue({
            id: deps.newId(),
            event: {
                type: DomainEvents.AUDIT_REQUESTED,
                payload: {
                    actorId: "system:outbox",
                    action: "notification_skipped_stale",
                    entityType: "outbox_event",
                    entityId: event.id,
                    at: deps.now().toISOString(),
                    meta: {
                        notificationType: DomainEvents.ALERT_NOTIFICATION_REQUESTED,
                        ageMs,
                        maxAgeMs,
                        sourceTimestamp: payload.createdAt,
                    },
                },
            },
        });
        return;
    }
    await deps.notificationSender.sendAlert(payload);
};

export const alertNotificationRequestedHandlerType = DomainEvents.ALERT_NOTIFICATION_REQUESTED;
