import type { SubscriptionRequestsService, SubscriptionRequestsServiceDeps } from "./subscriptionRequests.types.js";

export function createSubscriptionRequestsService(
    deps: SubscriptionRequestsServiceDeps
): SubscriptionRequestsService {
    return {
        withTx(tx: unknown) {
            return createSubscriptionRequestsService({
                ...deps,
                subscriptionRequestsRepo: deps.subscriptionRequestsRepo.withTx(tx)
            });
        },



        createPending(input) {
            return deps.subscriptionRequestsRepo.createPending(input);
        },
        getById(id) {
            return deps.subscriptionRequestsRepo.getById(id);
        },
        getByIdSync(id) {
            return deps.subscriptionRequestsRepo.getByIdSync(id);
        },
        getPendingByTgUserAndIin(input) {
            return deps.subscriptionRequestsRepo.getPendingByTgUserAndIin(input);
        },
        updateStatus(input) {
            return deps.subscriptionRequestsRepo.updateStatus(input);
        },
        updateStatusSync(input) {
            return deps.subscriptionRequestsRepo.updateStatusSync(input);
        },
        listPendingNew(input) {
            return deps.subscriptionRequestsRepo.listPendingNew(input);
        },
        markReadyForReview(input) {
            return deps.subscriptionRequestsRepo.markReadyForReview(input);
        },
        markNeedsPerson(input) {
            return deps.subscriptionRequestsRepo.markNeedsPerson(input);
        },
        listPendingForAdmin(input) {
            return deps.subscriptionRequestsRepo.listPendingForAdmin(input);
        },
        listForAdmin(input) {
            return deps.subscriptionRequestsRepo.listForAdmin(input);
        },
        listByTgUserId(input) {
            return deps.subscriptionRequestsRepo.listByTgUserId(input);
        }
    };
}


