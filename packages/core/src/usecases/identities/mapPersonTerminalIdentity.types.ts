import type { OutboxRepo } from "../../ports/outbox.js";
import type { PersonsService } from "../../identities/index.js";
import type { PersonTerminalIdentitiesService } from "../../identities/index.js";
import type { AccessEventsService } from "../../events/services/accessEvents.types.js";
import type { Clock, IdGenerator } from "../../utils/common.types.js";

export type MapPersonTerminalIdentityInput = {
    personId: string;
    deviceId: string;
    terminalPersonId: string;
    adminId?: string | undefined;
};

export type MapPersonTerminalIdentityResult = {
    status: "linked" | "already_linked";
    updatedEvents: number;
};

export type MapPersonTerminalIdentityDeps = {
    personsService: PersonsService;
    personTerminalIdentitiesService: PersonTerminalIdentitiesService;
    accessEventsService: AccessEventsService;
    outbox: OutboxRepo;
    idGen: IdGenerator;
    clock: Clock;
};

export type MapPersonTerminalIdentityUC = (
    input: MapPersonTerminalIdentityInput
) => Promise<MapPersonTerminalIdentityResult>;