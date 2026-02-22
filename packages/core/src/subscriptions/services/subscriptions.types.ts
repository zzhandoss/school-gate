import type { Subscription } from "../entities/subscription.js";
import type { SubscriptionsRepo } from "../repos/subscriptions.repo.js";

export type SubscriptionsService = {
    upsertActive(input: { id: string; tgUserId: string; personId: string }): Promise<void>;
    upsertActiveSync(input: { id: string; tgUserId: string; personId: string }): void;
    setActiveByIdSync(input: { id: string; isActive: boolean }): boolean;
    listActiveByPersonId(personId: string): Promise<Subscription[]>;
    listByTgUserId(input: { tgUserId: string; onlyActive?: boolean }): Promise<Subscription[]>;
    getById(id: string): Promise<Subscription | null>;
    getByIdSync(id: string): Subscription | null;
    deactivate(input: { tgUserId: string; personId: string }): Promise<void>;
    withTx(tx: unknown): SubscriptionsService;
};

export type SubscriptionsServiceDeps = {
    subscriptionsRepo: SubscriptionsRepo;
};

