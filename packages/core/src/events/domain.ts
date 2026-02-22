import type { AlertEventStatus } from "../alerts/index.js";
import type { AlertSeverity } from "../alerts/index.js";

export const DomainEvents = {
    AUDIT_REQUESTED: "audit.requested",
    PARENT_NOTIFICATION_REQUESTED: "parent.notification.requested",
    ALERT_NOTIFICATION_REQUESTED: "alert.notification.requested"
} as const;

export type DomainEvents = typeof DomainEvents;

export type DomainEventType = typeof DomainEvents[keyof typeof DomainEvents];

export type AuditRequestedEvent = {
    type: DomainEvents["AUDIT_REQUESTED"];
    payload: {
        actorId: string;
        action: string;
        entityType: string;
        entityId: string;
        at: string; // ISO
        meta?: Record<string, any> | undefined;
    };
};

export type ParentNotificationRequestedEvent = {
    type: DomainEvents["PARENT_NOTIFICATION_REQUESTED"];
    payload: {
        accessEventId: string;
        deviceId: string;
        direction: "IN" | "OUT";
        occurredAt: string; // ISO
        personId: string;
        iin: string;
        firstName?: string | null | undefined;
        lastName?: string | null | undefined;
        tgUserId: string;
    };
};

export type AlertNotificationRequestedEvent = {
    type: DomainEvents["ALERT_NOTIFICATION_REQUESTED"];
    payload: {
        alertEventId: string;
        ruleId: string;
        ruleName: string;
        severity: AlertSeverity;
        status: AlertEventStatus;
        message: string;
        createdAt: string; // ISO
        tgUserId: string;
    };
};

export type DomainEvent = AuditRequestedEvent | ParentNotificationRequestedEvent | AlertNotificationRequestedEvent;
