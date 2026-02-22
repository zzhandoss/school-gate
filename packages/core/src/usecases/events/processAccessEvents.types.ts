import type { AccessEvent } from "../../events/entities/accessEvent.js";
import type { AccessEventsService } from "../../events/services/accessEvents.types.js";
import type { OutboxRepo } from "../../ports/outbox.js";
import type { PersonTerminalIdentitiesRepo } from "../../identities/repos/personTerminalIdentities.repo.js";
import type { PersonsRepo } from "../../identities/repos/persons.repo.js";
import type { SubscriptionsRepo } from "../../subscriptions/repos/subscriptions.repo.js";
import type { Clock, IdGenerator } from "../../utils/common.types.js";

export type ProcessAccessEventsInput = {
    limit: number;
    retryDelayMs: number;
    leaseMs: number;
    processingBy: string;
    maxAttempts: number;
};

export type ProcessAccessEventsResult = {
    processed: number;
    unmatched: number;
    failed: number;
    notifications: number;
};

export type ProcessAccessEventByIdInput = {
    id: string;
    retryDelayMs: number;
    leaseMs: number;
    processingBy: string;
    maxAttempts: number;
};

export type ProcessAccessEventByIdResult = {
    status: "processed" | "unmatched" | "failed" | "skipped";
    notifications: number;
};

export type ProcessAccessEventsTx = {
    run<T>(cb: (deps: { accessEventsService: AccessEventsService; outbox: OutboxRepo }) => T): T;
};

export type ProcessAccessEventsDeps = {
    accessEventsService: AccessEventsService;
    personsRepo: PersonsRepo;
    personTerminalIdentitiesRepo: PersonTerminalIdentitiesRepo;
    subscriptionsRepo: SubscriptionsRepo;
    tx: ProcessAccessEventsTx;
    idGen: IdGenerator;
    clock: Clock;
};

export type AccessEventProcessorDeps = {
    accessEventsService: AccessEventsService;
    personsRepo: PersonsRepo;
    personTerminalIdentitiesRepo: PersonTerminalIdentitiesRepo;
    subscriptionsRepo: SubscriptionsRepo;
    tx: ProcessAccessEventsTx;
    idGen: IdGenerator;
    clock: Clock;
};

export type AccessEventProcessor = {
    processEvent(
        event: AccessEvent,
        input: { retryDelayMs: number; maxAttempts: number }
    ): Promise<ProcessAccessEventsResult>;
};
