import { DomainEvents } from "../../events/domain.js";
import type { AccessEvent } from "../../events/entities/accessEvent.js";
import type {
    AccessEventProcessor,
    AccessEventProcessorDeps,
    ProcessAccessEventByIdInput,
    ProcessAccessEventByIdResult,
    ProcessAccessEventsDeps,
    ProcessAccessEventsInput,
    ProcessAccessEventsResult,
} from "./processAccessEvents.types.js";

function createAccessEventProcessor(deps: AccessEventProcessorDeps): AccessEventProcessor {
    async function resolvePerson(event: AccessEvent) {
        if (event.iin) {
            return deps.personsRepo.getByIin(event.iin);
        }

        if (!event.terminalPersonId) return null;

        const mapping = await deps.personTerminalIdentitiesRepo.getByDeviceAndTerminalPersonId({
            deviceId: event.deviceId,
            terminalPersonId: event.terminalPersonId,
        });

        if (!mapping) return null;
        return deps.personsRepo.getById(mapping.personId);
    }

    async function processEvent(
        event: AccessEvent,
        input: { retryDelayMs: number; maxAttempts: number }
    ): Promise<ProcessAccessEventsResult> {
        try {
            const person = await resolvePerson(event);
            if (!person) {
                await deps.accessEventsService.markUnmatched({ id: event.id });
                return { processed: 0, unmatched: 1, failed: 0, notifications: 0 };
            }

            const subs = await deps.subscriptionsRepo.listActiveByPersonId(person.id);
            const processedAt = deps.clock.now();
            const occurredAtIso = event.occurredAt.toISOString();

            if (!subs.length) {
                await deps.accessEventsService.markProcessed({ id: event.id, processedAt });
                return { processed: 1, unmatched: 0, failed: 0, notifications: 0 };
            }

            deps.tx.run(({ accessEventsService, outbox }) => {
                for (const sub of subs) {
                    outbox.enqueue({
                        id: deps.idGen.nextId(),
                        event: {
                            type: DomainEvents.PARENT_NOTIFICATION_REQUESTED,
                            payload: {
                                accessEventId: event.id,
                                deviceId: event.deviceId,
                                direction: event.direction,
                                occurredAt: occurredAtIso,
                                personId: person.id,
                                iin: person.iin,
                                firstName: person.firstName ?? null,
                                lastName: person.lastName ?? null,
                                tgUserId: sub.tgUserId,
                            },
                        },
                    });
                }

                accessEventsService.markProcessedSync({ id: event.id, processedAt });
            });

            return { processed: 1, unmatched: 0, failed: 0, notifications: subs.length };
        } catch (e: any) {
            const attemptAt = deps.clock.now();
            const nextAttemptAt = new Date(attemptAt.getTime() + input.retryDelayMs);
            await deps.accessEventsService.markFailed({
                id: event.id,
                error: String(e?.message ?? e),
                attempts: event.attempts + 1,
                maxAttempts: input.maxAttempts,
                nextAttemptAt,
            });
            return { processed: 0, unmatched: 0, failed: 1, notifications: 0 };
        }
    }

    return { processEvent };
}

export function createProcessAccessEventsUC(deps: ProcessAccessEventsDeps) {
    const processor = createAccessEventProcessor(deps);

    return async function processBatch(input: ProcessAccessEventsInput): Promise<ProcessAccessEventsResult> {
        const batchNow = deps.clock.now();
        const events = await deps.accessEventsService.claimBatch({
            limit: input.limit,
            now: batchNow,
            leaseMs: input.leaseMs,
            processingBy: input.processingBy,
        });

        let processed = 0;
        let unmatched = 0;
        let failed = 0;
        let notifications = 0;

        for (const event of events) {
            const res = await processor.processEvent(event, {
                retryDelayMs: input.retryDelayMs,
                maxAttempts: input.maxAttempts,
            });
            processed += res.processed;
            unmatched += res.unmatched;
            failed += res.failed;
            notifications += res.notifications;
        }

        return { processed, unmatched, failed, notifications };
    };
}

export function createProcessAccessEventByIdUC(deps: ProcessAccessEventsDeps) {
    const processor = createAccessEventProcessor(deps);

    return async function processById(
        input: ProcessAccessEventByIdInput
    ): Promise<ProcessAccessEventByIdResult> {
        const event = await deps.accessEventsService.claimById({
            id: input.id,
            now: deps.clock.now(),
            leaseMs: input.leaseMs,
            processingBy: input.processingBy,
        });

        if (!event) {
            return { status: "skipped", notifications: 0 };
        }

        const res = await processor.processEvent(event, {
            retryDelayMs: input.retryDelayMs,
            maxAttempts: input.maxAttempts,
        });

        if (res.failed > 0) return { status: "failed", notifications: 0 };
        if (res.unmatched > 0) return { status: "unmatched", notifications: 0 };
        return { status: "processed", notifications: res.notifications };
    };
}
