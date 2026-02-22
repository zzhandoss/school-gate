import type { SubscriptionAdminView } from "../models/index.js";

export type SubscriptionsAdminQueryPort = {
    list(input: {
        limit: number;
        offset: number;
        personId?: string | undefined;
        tgUserId?: string | undefined;
        onlyActive?: boolean | undefined;
    }): Promise<SubscriptionAdminView[]>;
};
