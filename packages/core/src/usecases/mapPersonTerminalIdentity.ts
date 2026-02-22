import { createMapPersonTerminalIdentityUC as createModernMapPersonTerminalIdentityUC } from "./identities/mapPersonTerminalIdentity.js";
import { createAccessEventsService } from "../events/services/accessEvents.service.js";
import { createPersonsService } from "../identities/services/persons.service.js";
import { createPersonTerminalIdentitiesService } from "../identities/services/personTerminalIdentities.service.js";
import type { OutboxRepo } from "../ports/outbox.js";

const noopOutbox: OutboxRepo = {
    enqueue() {},
    claimBatch() {
        return [];
    },
    markProcessed() {},
    markFailed() {}
};

export function createMapPersonTerminalIdentityUC(deps: any) {
    if ("personsService" in deps) {
        return createModernMapPersonTerminalIdentityUC(deps);
    }

    return createModernMapPersonTerminalIdentityUC({
        personsService: createPersonsService({ personsRepo: deps.personsRepo }),
        personTerminalIdentitiesService: createPersonTerminalIdentitiesService({
            personTerminalIdentitiesRepo: deps.personTerminalIdentitiesRepo
        }),
        accessEventsService: createAccessEventsService({ accessEventsRepo: deps.accessEventsRepo }),
        outbox: deps.outbox ?? noopOutbox,
        idGen: deps.idGen,
        clock: deps.clock ?? { now: () => new Date() }
    });
}
