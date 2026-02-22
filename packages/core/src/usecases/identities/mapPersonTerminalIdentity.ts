import { enqueueAuditRequested } from "../../audit/events/auditRequested.js";
import { PersonNotFoundError, TerminalIdentityAlreadyMappedError } from "../../utils/errors.js";
import type {
    MapPersonTerminalIdentityDeps,
    MapPersonTerminalIdentityUC,
    MapPersonTerminalIdentityResult
} from "./mapPersonTerminalIdentity.types.js";

export function createMapPersonTerminalIdentityUC(
    deps: MapPersonTerminalIdentityDeps
): MapPersonTerminalIdentityUC {
    return async function mapIdentity(input): Promise<MapPersonTerminalIdentityResult> {
        const person = await deps.personsService.getById(input.personId);
        if (!person) {
            throw new PersonNotFoundError();
        }

        const existing = await deps.personTerminalIdentitiesService.getByDeviceAndTerminalPersonId({
            deviceId: input.deviceId,
            terminalPersonId: input.terminalPersonId
        });

        if (existing && existing.personId !== input.personId) {
            throw new TerminalIdentityAlreadyMappedError();
        }

        const status = existing ? "already_linked" : "linked";

        if (!existing) {
            await deps.personTerminalIdentitiesService.upsert({
                id: deps.idGen.nextId(),
                personId: input.personId,
                deviceId: input.deviceId,
                terminalPersonId: input.terminalPersonId
            });
        }

        const updatedEvents = await deps.accessEventsService.markReadyByTerminalIdentity({
            deviceId: input.deviceId,
            terminalPersonId: input.terminalPersonId
        });

        enqueueAuditRequested({
            outbox: deps.outbox,
            id: deps.idGen.nextId(),
            actorId: input.adminId ?? "system:identity_mapping",
            action: "person_terminal_identity_mapped",
            entityType: "person_terminal_identity",
            entityId: `${input.deviceId}:${input.terminalPersonId}`,
            at: deps.clock.now(),
            meta: {
                personId: input.personId,
                status,
                updatedEvents
            }
        });

        return { status, updatedEvents };
    };
}