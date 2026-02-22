import type { NotificationSender } from "@school-gate/core";

export type OutboxEventRecord = {
    id: string;
    type: string;
    payloadJson: string;
    attempts: number;
};

export type OutboxHandlersDeps = {
    db?: any;
    now: () => Date;
    newId: () => string;
    notificationSender?: NotificationSender | undefined;
    notificationFreshness?: {
        parentMaxAgeMs?: number | undefined;
        alertMaxAgeMs?: number | undefined;
    } | undefined;
};

export type OutboxEventHandler = (event: OutboxEventRecord, deps: OutboxHandlersDeps) => Promise<void>;
