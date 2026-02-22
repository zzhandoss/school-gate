import { createIngestAccessEventUC as createModernIngestAccessEventUC } from "./events/ingestAccessEvent.js";
import { createAccessEventsService } from "../events/services/accessEvents.service.js";
import { createPersonsService } from "../identities/services/persons.service.js";
import { createPersonTerminalIdentitiesService } from "../identities/services/personTerminalIdentities.service.js";
import type { AccessEventsRepo } from "../events/repos/accessEvents.repo.js";
import type { PersonsRepo } from "../identities/repos/persons.repo.js";
import type { PersonTerminalIdentitiesRepo } from "../identities/repos/personTerminalIdentities.repo.js";
import type { OutboxRepo } from "../ports/outbox.js";
import type { IdGenerator, Clock } from "../utils/common.types.js";

type LegacyDeps = {
    accessEventsRepo: AccessEventsRepo;
    personsRepo: PersonsRepo;
    personTerminalIdentitiesRepo: PersonTerminalIdentitiesRepo;
    idGen: IdGenerator;
    inlineQueue?: { enqueue(id: string): void };
    clock?: Clock;
    outbox?: OutboxRepo;
};

const noopOutbox: OutboxRepo = {
    enqueue() {},
    claimBatch() {
        return [];
    },
    markProcessed() {},
    markFailed() {}
};

export function createIngestAccessEventUC(deps: any) {
    if ("accessEventsService" in deps) {
        return createModernIngestAccessEventUC(deps);
    }

    const legacy = deps as LegacyDeps;
    return createModernIngestAccessEventUC({
        accessEventsService: createAccessEventsService({ accessEventsRepo: legacy.accessEventsRepo }),
        personsService: createPersonsService({ personsRepo: legacy.personsRepo }),
        personTerminalIdentitiesService: createPersonTerminalIdentitiesService({
            personTerminalIdentitiesRepo: legacy.personTerminalIdentitiesRepo
        }),
        outbox: legacy.outbox ?? noopOutbox,
        idGen: legacy.idGen,
        clock: legacy.clock ?? { now: () => new Date() },
        ...(legacy.inlineQueue ? { inlineQueue: legacy.inlineQueue } : {})
    });
}
