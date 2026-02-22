import type { SubscriptionAdminView, SubscriptionsAdminQueryPort } from "../../ports/index.js";

export type ListSubscriptionsAdminInput = {
    limit: number;
    offset: number;
    personId?: string | undefined;
    tgUserId?: string | undefined;
    onlyActive?: boolean | undefined;
};

export type ListSubscriptionsAdminDeps = {
    subscriptionsAdminQuery: SubscriptionsAdminQueryPort;
};

export type ListSubscriptionsAdminUC = (
    input: ListSubscriptionsAdminInput
) => Promise<SubscriptionAdminView[]>;
