import type { Clock, IdGenerator } from "../../utils/common.types.js";
import type { OutboxRepo } from "../../ports/outbox.js";
import type { ParentsService } from "../services/parents.types.js";
import type { SubscriptionRequestsService } from "../services/subscriptionRequests.types.js";

export type RequestSubscriptionInput = {
    tgUserId: string;
    chatId: string;
    iin: string;
};

export type RequestSubscriptionResult = {
    requestId: string;
    status: "pending";
    iin: string;
};

export type RequestSubscriptionFlow = (
    input: RequestSubscriptionInput
) => Promise<RequestSubscriptionResult>;

export type RequestSubscriptionDeps = {
    parentsService: ParentsService;
    subscriptionRequestsService: SubscriptionRequestsService;
    idGen: IdGenerator;
    clock: Clock;
    outbox: OutboxRepo;
};