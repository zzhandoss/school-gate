import { createReviewSubscriptionRequestFlow } from "../subscriptions/flows/reviewSubscriptionRequest.flow.js";
import { createSubscriptionsService } from "../subscriptions/services/subscriptions.service.js";
import { createSubscriptionRequestsService } from "../subscriptions/services/subscriptionRequests.service.js";
import type { OutboxRepo } from "../ports/outbox.js";

function adaptTx(legacyTx: any) {
    return {
        run<T>(cb: (deps: { subscriptionRequestsService: any; subscriptionsService: any; outbox: OutboxRepo }) => T) {
            return legacyTx.run((txDeps: any) => {
                const subscriptionRequestsService = txDeps.subscriptionRequestsService
                    ?? createSubscriptionRequestsService({ subscriptionRequestsRepo: txDeps.subscriptionRequestsRepo });
                const subscriptionsService = txDeps.subscriptionsService
                    ?? createSubscriptionsService({ subscriptionsRepo: txDeps.subscriptionsRepo });

                return cb({
                    subscriptionRequestsService,
                    subscriptionsService,
                    outbox: txDeps.outbox
                });
            });
        }
    };
}

export function createReviewSubscriptionRequestUC(deps: any) {
    if ("subscriptionRequestsService" in deps && "tx" in deps) {
        return createReviewSubscriptionRequestFlow(deps);
    }

    return createReviewSubscriptionRequestFlow({
        tx: adaptTx(deps.tx),
        idGen: deps.idGen,
        clock: deps.clock,
        subscriptionRequestsService: createSubscriptionRequestsService({
            subscriptionRequestsRepo: deps.subscriptionRequestsRepo
        })
    });
}
