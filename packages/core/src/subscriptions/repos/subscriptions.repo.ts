import type { Subscription } from "../entities/subscription.js";

export interface SubscriptionsRepo {
    upsertActive(input: { id: string; tgUserId: string; personId: string }): Promise<void>;
    upsertActiveSync(input: { id: string; tgUserId: string; personId: string }): void;

    listActiveByPersonId(personId: string): Promise<Subscription[]>;

    deactivate(input: { tgUserId: string; personId: string }): Promise<void>;

    listByTgUserId(input: { tgUserId: string; onlyActive?: boolean }): Promise<Subscription[]>;

    getById(id: string): Promise<Subscription | null>;
    getByIdSync(id: string): Subscription | null;

    setActiveByIdSync(input: { id: string; isActive: boolean }): boolean;
    withTx(tx: unknown): SubscriptionsRepo;
}

