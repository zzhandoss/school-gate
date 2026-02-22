import type {
    AlertSubscriptionsService,
    AlertSubscriptionsServiceDeps,
} from "./alertSubscriptions.types.js";

export function createAlertSubscriptionsService(
    deps: AlertSubscriptionsServiceDeps
): AlertSubscriptionsService {
    return {
        withTx(tx: unknown) {
            return createAlertSubscriptionsService({
                ...deps,
                subscriptionsRepo: deps.subscriptionsRepo.withTx(tx),
            });
        },



        async upsert(input) {
            const now = deps.clock.now();
            await deps.subscriptionsRepo.upsert({
                adminId: input.adminId,
                ruleId: input.ruleId,
                isEnabled: input.isEnabled,
                createdAt: now,
                updatedAt: now,
            });
        },
        list(input) {
            return deps.subscriptionsRepo.list(input);
        },
        listRecipientsByRuleIds(input) {
            return deps.subscriptionsRepo.listRecipientsByRuleIds(input);
        },
    };
}


