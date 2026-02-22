import type { Clock, IdGenerator } from "../../utils/common.types.js";
import type { Outbox } from "../../ports/outbox.js";
import type { SubscriptionsService } from "../services/subscriptions.types.js";
import type { SubscriptionRequestsService } from "../services/subscriptionRequests.types.js";

export type ReviewDecision = "approve" | "reject";

export type ReviewSubscriptionRequestInput = {
    requestId: string;
    adminTgUserId: string;
    decision: ReviewDecision;
};

export type ReviewSubscriptionRequestResult = {
    requestId: string;
    status: "approved" | "rejected";
    personId: string | null;
};

export type ReviewSubscriptionRequestServices = {
    subscriptionRequestsService: Pick<SubscriptionRequestsService, "getByIdSync" | "updateStatusSync">;
    subscriptionsService: Pick<SubscriptionsService, "upsertActiveSync">;
    outbox: Outbox;
};

export type ReviewSubscriptionRequestTx = {
    run<T>(cb: (repos: ReviewSubscriptionRequestServices) => T): T;
};

export type ReviewSubscriptionRequestFlow = (
    input: ReviewSubscriptionRequestInput
) => Promise<ReviewSubscriptionRequestResult>;

export type ReviewSubscriptionRequestDeps = {
    tx: ReviewSubscriptionRequestTx;
    idGen: IdGenerator;
    clock: Clock;
    subscriptionRequestsService: SubscriptionRequestsService;
};
