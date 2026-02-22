import type { AlertRecipient, AlertSubscription } from "../entities/alertSubscriptions.types.js";

export type UpsertAlertSubscriptionInput = {
    adminId: string;
    ruleId: string;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
};

export type ListAlertSubscriptionsInput = {
    limit: number;
    offset: number;
    adminId?: string | undefined;
    ruleId?: string | undefined;
    onlyEnabled?: boolean | undefined;
};

export interface AlertSubscriptionsRepo {
    upsert(input: UpsertAlertSubscriptionInput): Promise<void>;
    list(input: ListAlertSubscriptionsInput): Promise<AlertSubscription[]>;
    listRecipientsByRuleIds(input: {
        ruleIds: string[];
        onlyEnabled?: boolean | undefined;
    }): Promise<AlertRecipient[]>;
    withTx(tx: unknown): AlertSubscriptionsRepo;
}

