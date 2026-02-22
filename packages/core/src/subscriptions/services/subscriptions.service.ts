import type { SubscriptionsService, SubscriptionsServiceDeps } from "./subscriptions.types.js";

export function createSubscriptionsService(deps: SubscriptionsServiceDeps): SubscriptionsService {
    return {
        withTx(tx: unknown) {
            return createSubscriptionsService({
                ...deps,
                subscriptionsRepo: deps.subscriptionsRepo.withTx(tx)
            });
        },



        upsertActive(input) {
            return deps.subscriptionsRepo.upsertActive(input);
        },
        upsertActiveSync(input) {
            return deps.subscriptionsRepo.upsertActiveSync(input);
        },
        setActiveByIdSync(input) {
            return deps.subscriptionsRepo.setActiveByIdSync(input);
        },
        listActiveByPersonId(personId) {
            return deps.subscriptionsRepo.listActiveByPersonId(personId);
        },
        listByTgUserId(input) {
            return deps.subscriptionsRepo.listByTgUserId(input);
        },
        getById(id) {
            return deps.subscriptionsRepo.getById(id);
        },
        getByIdSync(id) {
            return deps.subscriptionsRepo.getByIdSync(id);
        },
        deactivate(input) {
            return deps.subscriptionsRepo.deactivate(input);
        }
    };
}


