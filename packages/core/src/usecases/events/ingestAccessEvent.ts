import { enqueueAuditRequested } from "../../audit/events/auditRequested.js";
import { isValidIin, normalizeIin } from "../../utils/iin.js";
import { InvalidIinError, TerminalIdentityAlreadyMappedError } from "../../utils/errors.js";
import type { AccessEventStatus } from "../../events/index.js";
import type {
    IngestAccessEventDeps,
    IngestAccessEventInput,
    IngestAccessEventResult,
} from "./ingestAccessEvent.types.js";

export function createIngestAccessEventUC(deps: IngestAccessEventDeps) {
    return async function ingest(input: IngestAccessEventInput): Promise<IngestAccessEventResult> {
        const terminalPersonId = input.terminalPersonId ?? null;
        const iin = input.iin ? normalizeIin(input.iin) : null;

        if (iin && !isValidIin(iin)) {
            throw new InvalidIinError();
        }

        const existingMapping = terminalPersonId
            ? await deps.personTerminalIdentitiesService.getByDeviceAndTerminalPersonId({
                deviceId: input.deviceId,
                terminalPersonId,
            })
            : null;

        let personId: string | null = null;
        let personCreated = false;
        if (iin) {
            const person = await deps.personsService.getByIin(iin);
            if (person) {
                personId = person.id;
            } else {
                personId = deps.idGen.nextId();
                await deps.personsService.create({ id: personId, iin });
                personCreated = true;
            }

            if (terminalPersonId) {
                if (existingMapping && existingMapping.personId !== personId) {
                    throw new TerminalIdentityAlreadyMappedError();
                }

                await deps.personTerminalIdentitiesService.upsert({
                    id: deps.idGen.nextId(),
                    personId,
                    deviceId: input.deviceId,
                    terminalPersonId,
                });
            }
        }

        const status: AccessEventStatus = iin || existingMapping ? "NEW" : "UNMATCHED";

        const accessEventId = deps.idGen.nextId();
        const result = await deps.accessEventsService.insertIdempotent({
            id: accessEventId,
            deviceId: input.deviceId,
            direction: input.direction,
            occurredAt: input.occurredAt,
            iin,
            terminalPersonId,
            idempotencyKey: `${input.deviceId}:${input.eventId}`,
            rawPayload: input.rawPayload ?? null,
            status,
        });

        if (result === "inserted" && status === "NEW") {
            deps.inlineQueue?.enqueue(accessEventId);
        }

        if (personCreated && personId) {
            enqueueAuditRequested({
                outbox: deps.outbox,
                id: deps.idGen.nextId(),
                actorId: "system:access_ingest",
                action: "person_auto_created_from_access_event",
                entityType: "person",
                entityId: personId,
                at: deps.clock.now(),
                meta: { iin, deviceId: input.deviceId, accessEventId },
            });
        }

        return { result, status, personId, accessEventId: result === "inserted" ? accessEventId : null };
    };
}