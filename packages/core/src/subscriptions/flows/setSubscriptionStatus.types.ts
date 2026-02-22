import type { Clock, IdGenerator } from "../../utils/common.types.js";
import type { OutboxRepo } from "../../ports/outbox.js";
import type { SubscriptionsRepo } from "../repos/subscriptions.repo.js";

export type SetSubscriptionStatusInput = {
    subscriptionId: string;
    isActive: boolean;
    adminId: string;
};

export type SetSubscriptionStatusTx = {
    run<T>(
        cb: (deps: {
            subscriptionsRepo: Pick<SubscriptionsRepo, "setActiveByIdSync">;
            outbox: OutboxRepo;
        }) => T
    ): T;
};

export type SetSubscriptionStatusFlow = (
    input: SetSubscriptionStatusInput
) => Promise<boolean>;

export type SetSubscriptionStatusDeps = {
    tx: SetSubscriptionStatusTx;
    idGen: IdGenerator;
    clock: Clock;
};
