import { createRequestSubscriptionFlow } from "../subscriptions/flows/requestSubscription.flow.js";
import { createParentsService } from "../subscriptions/services/parents.service.js";
import { createSubscriptionRequestsService } from "../subscriptions/services/subscriptionRequests.service.js";
import type { ParentsRepo } from "../subscriptions/repos/parents.repo.js";
import type { SubscriptionRequestsRepo } from "../subscriptions/repos/subscriptionRequests.repo.js";
import type { IdGenerator } from "../utils/common.types.js";
import type { OutboxRepo } from "../ports/outbox.js";

type LegacyDeps = {
    parentsRepo: ParentsRepo;
    subscriptionRequestsRepo: SubscriptionRequestsRepo;
    idGen: IdGenerator;
};

const noopOutbox: OutboxRepo = {
    enqueue() {},
    claimBatch() {
        return [];
    },
    markProcessed() {},
    markFailed() {}
};

export function createRequestSubscriptionUC(deps: LegacyDeps) {
    const parentsService = createParentsService({ parentsRepo: deps.parentsRepo });
    const subscriptionRequestsService = createSubscriptionRequestsService({
        subscriptionRequestsRepo: deps.subscriptionRequestsRepo
    });

    return createRequestSubscriptionFlow({
        parentsService,
        subscriptionRequestsService,
        idGen: deps.idGen,
        clock: { now: () => new Date() },
        outbox: noopOutbox
    });
}
