import type { AlertRecipient, AlertSubscription } from "../entities/alertSubscriptions.types.js";
import type {
    AlertSubscriptionsRepo,
    ListAlertSubscriptionsInput,
} from "../repos/alertSubscriptions.repo.js";
import type { Clock } from "../../utils/index.js";

export type UpsertAlertSubscriptionInput = {
    adminId: string;
    ruleId: string;
    isEnabled: boolean;
};

export type AlertSubscriptionsService = {
    upsert(input: UpsertAlertSubscriptionInput): Promise<void>;
    list(input: ListAlertSubscriptionsInput): Promise<AlertSubscription[]>;
    listRecipientsByRuleIds(input: {
        ruleIds: string[];
        onlyEnabled?: boolean | undefined;
    }): Promise<AlertRecipient[]>;
    withTx(tx: unknown): AlertSubscriptionsService;
};

export type AlertSubscriptionsServiceDeps = {
    subscriptionsRepo: AlertSubscriptionsRepo;
    clock: Clock;
};

