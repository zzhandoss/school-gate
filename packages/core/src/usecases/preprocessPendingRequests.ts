import { createPreprocessPendingRequestsUC as createModernPreprocessPendingRequestsUC } from "./subscriptions/preprocessPendingRequests.js";
import { createPersonsService } from "../identities/services/persons.service.js";
import { createPersonTerminalIdentitiesService } from "../identities/services/personTerminalIdentities.service.js";
import { createSubscriptionRequestsService } from "../subscriptions/services/subscriptionRequests.service.js";

export function createPreprocessPendingRequestsUC(deps: any) {
    if ("subscriptionRequestsService" in deps) {
        return createModernPreprocessPendingRequestsUC(deps);
    }

    return createModernPreprocessPendingRequestsUC({
        subscriptionRequestsService: createSubscriptionRequestsService({
            subscriptionRequestsRepo: deps.subscriptionRequestsRepo
        }),
        personsService: createPersonsService({ personsRepo: deps.personsRepo }),
        personTerminalIdentitiesService: createPersonTerminalIdentitiesService({
            personTerminalIdentitiesRepo: deps.personTerminalIdentitiesRepo
        }),
        personResolver: deps.personResolver,
        flags: deps.flags,
        idGen: deps.idGen,
        clock: deps.clock
    });
}
