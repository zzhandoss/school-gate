import type { Clock, IdGenerator } from "../../utils/common.types.js";
import type { OutboxRepo } from "../../ports/outbox.js";
import type { Subscription } from "../entities/subscription.js";
import type { SubscriptionsRepo } from "../repos/subscriptions.repo.js";

export type SetParentSubscriptionStatusInput = {
    tgUserId: string;
    subscriptionId: string;
    isActive: boolean;
};

export type SetParentSubscriptionStatusTx = {
    run<T>(
        cb: (deps: {
            subscriptionsRepo: Pick<SubscriptionsRepo, "getByIdSync" | "setActiveByIdSync">;
            outbox: OutboxRepo;
        }) => T
    ): T;
};

export type SetParentSubscriptionStatusFlow = (
    input: SetParentSubscriptionStatusInput
) => Promise<Pick<Subscription, "id" | "isActive">>;

export type SetParentSubscriptionStatusDeps = {
    tx: SetParentSubscriptionStatusTx;
    idGen: IdGenerator;
    clock: Clock;
};
