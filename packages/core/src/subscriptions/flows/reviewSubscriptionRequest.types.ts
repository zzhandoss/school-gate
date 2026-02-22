import type { Clock, IdGenerator } from "../../utils/common.types.js";
import type { Outbox, OutboxRepo } from "../../ports/outbox.js";
import type { SubscriptionRequestsRepo } from "../repos/subscriptionRequests.repo.js";
import type { SubscriptionsRepo } from "../repos/subscriptions.repo.js";
import { SubscriptionsService } from "../services/subscriptions.types.js";
import { SubscriptionRequestsService } from "../services/subscriptionRequests.types.js";

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
