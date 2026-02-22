import type { SubscriptionRequestsRepo } from "../subscriptions/repos/subscriptionRequests.repo.js";

type LegacyDeps = {
    subscriptionRequestsRepo: SubscriptionRequestsRepo;
};

type LegacyInput = {
    limit: number;
    offset?: number;
    only?: "all" | "ready_for_review" | "needs_person" | "new";
    order?: "oldest" | "newest";
    status?: "all" | "pending" | "approved" | "rejected" | "not_pending";
};

export function createListPendingSubscriptionRequestsUC(deps: LegacyDeps) {
    return async function listPending(input: LegacyInput) {
        const result = await deps.subscriptionRequestsRepo.listForAdmin({
            limit: input.limit,
            offset: input.offset ?? 0,
            only: input.only ?? "all",
            order: input.order ?? "oldest",
            status: input.status ?? "pending"
        });

        return {
            requests: result.requests,
            page: {
                limit: input.limit,
                offset: input.offset ?? 0,
                total: result.total
            }
        };
    };
}
