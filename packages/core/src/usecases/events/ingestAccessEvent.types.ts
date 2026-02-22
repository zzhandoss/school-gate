import type { OutboxRepo } from "../../ports/outbox.js";
import type { Clock, IdGenerator } from "../../utils/common.types.js";
import type { AccessEventDirection, AccessEventStatus } from "../../events/entities/accessEvent.js";
import type { AccessEventsService } from "../../events/services/accessEvents.types.js";
import type { PersonsService } from "../../identities/services/persons.types.js";
import type { PersonTerminalIdentitiesService } from "../../identities/services/personTerminalIdentities.types.js";

export type IngestAccessEventInput = {
    eventId: string;
    deviceId: string;
    direction: AccessEventDirection;
    occurredAt: Date;
    terminalPersonId?: string | null;
    iin?: string | null;
    rawPayload?: string | null;
};

export type IngestAccessEventResult = {
    result: "inserted" | "duplicate";
    status: AccessEventStatus;
    personId: string | null;
    accessEventId: string | null;
};

export type IngestAccessEventDeps = {
    accessEventsService: AccessEventsService;
    personsService: PersonsService;
    personTerminalIdentitiesService: PersonTerminalIdentitiesService;
    outbox: OutboxRepo;
    idGen: IdGenerator;
    clock: Clock;
    inlineQueue?: { enqueue(id: string): void };
};