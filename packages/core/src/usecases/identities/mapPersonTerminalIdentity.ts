import { enqueueAuditRequested } from "../../audit/events/auditRequested.js";
import { createAccessEventsService } from "../../events/services/accessEvents.service.js";
import { createPersonsService } from "../../identities/services/persons.service.js";
import { createPersonTerminalIdentitiesService } from "../../identities/services/personTerminalIdentities.service.js";
import { PersonNotFoundError, TerminalIdentityAlreadyMappedError } from "../../utils/errors.js";
import type {
    MapPersonTerminalIdentityDeps,
    MapPersonTerminalIdentityUC,
    MapPersonTerminalIdentityResult
} from "./mapPersonTerminalIdentity.types.js";
import type { OutboxRepo } from "../../ports/outbox.js";

const noopOutbox: OutboxRepo = {
    enqueue() {},
    claimBatch() {
        return [];
    },
    markProcessed() {},
    markFailed() {}
};

function toDeps(input: any): MapPersonTerminalIdentityDeps {
    if ("personsService" in input) {
        return input;
    }

    return {
        personsService: createPersonsService({ personsRepo: input.personsRepo }),
        personTerminalIdentitiesService: createPersonTerminalIdentitiesService({
            personTerminalIdentitiesRepo: input.personTerminalIdentitiesRepo
        }),
        accessEventsService: createAccessEventsService({ accessEventsRepo: input.accessEventsRepo }),
        outbox: input.outbox ?? noopOutbox,
        idGen: input.idGen,
        clock: input.clock ?? { now: () => new Date() }
    };
}

export function createMapPersonTerminalIdentityUC(
    deps: MapPersonTerminalIdentityDeps
): MapPersonTerminalIdentityUC {
    const normalizedDeps = toDeps(deps);
    return async function mapIdentity(input): Promise<MapPersonTerminalIdentityResult> {
        const person = await normalizedDeps.personsService.getById(input.personId);
        if (!person) {
            throw new PersonNotFoundError();
        }

        const existing = await normalizedDeps.personTerminalIdentitiesService.getByDeviceAndTerminalPersonId({
            deviceId: input.deviceId,
            terminalPersonId: input.terminalPersonId
        });

        if (existing && existing.personId !== input.personId) {
            throw new TerminalIdentityAlreadyMappedError();
        }

        const status = existing ? "already_linked" : "linked";

        if (!existing) {
            await normalizedDeps.personTerminalIdentitiesService.upsert({
                id: normalizedDeps.idGen.nextId(),
                personId: input.personId,
                deviceId: input.deviceId,
                terminalPersonId: input.terminalPersonId
            });
        }

        const updatedEvents = await normalizedDeps.accessEventsService.markReadyByTerminalIdentity({
            deviceId: input.deviceId,
            terminalPersonId: input.terminalPersonId
        });

        enqueueAuditRequested({
            outbox: normalizedDeps.outbox,
            id: normalizedDeps.idGen.nextId(),
            actorId: input.adminId ?? "system:identity_mapping",
            action: "person_terminal_identity_mapped",
            entityType: "person_terminal_identity",
            entityId: `${input.deviceId}:${input.terminalPersonId}`,
            at: normalizedDeps.clock.now(),
            meta: {
                personId: input.personId,
                status,
                updatedEvents
            }
        });

        return { status, updatedEvents };
    };
}
