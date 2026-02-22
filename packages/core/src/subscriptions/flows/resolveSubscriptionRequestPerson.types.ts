import type { OutboxRepo } from "../../ports/outbox.js";
import type { Clock, IdGenerator } from "../../utils/common.types.js";
import type { PersonsService } from "../../identities/services/persons.types.js";
import type { SubscriptionRequestsService } from "../services/subscriptionRequests.types.js";

export type ResolveSubscriptionRequestPersonInput = {
    requestId: string;
    personId: string;
    adminId?: string | undefined;
};

export type ResolveSubscriptionRequestPersonResult = {
    requestId: string;
    resolutionStatus: "ready_for_review";
    personId: string;
};

export type ResolveSubscriptionRequestPersonFlow = (
    input: ResolveSubscriptionRequestPersonInput
) => Promise<ResolveSubscriptionRequestPersonResult>;

export type ResolveSubscriptionRequestPersonDeps = {
    subscriptionRequestsService: SubscriptionRequestsService;
    personsService: Pick<PersonsService, "getById">;
    idGen: IdGenerator;
    clock: Clock;
    outbox: OutboxRepo;
};