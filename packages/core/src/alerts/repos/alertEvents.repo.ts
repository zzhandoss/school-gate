import type {
    AlertEvent,
    AlertEventDetails,
    AlertEventStatus,
} from "../entities/alertEvents.types.js";
import type { AlertSeverity } from "../entities/alertRules.types.js";

export type CreateAlertEventInput = {
    id: string;
    ruleId: string;
    snapshotId: string | null;
    status: AlertEventStatus;
    severity: AlertSeverity;
    message: string;
    details: AlertEventDetails | null;
    createdAt: Date;
};

export type ListAlertEventsInput = {
    limit: number;
    offset: number;
    ruleId?: string | undefined;
    status?: AlertEventStatus | undefined;
    from?: Date | undefined;
    to?: Date | undefined;
};

export interface AlertEventsRepo {
    insertSync(input: CreateAlertEventInput): void;
    list(input: ListAlertEventsInput): Promise<AlertEvent[]>;
    listLatestByRuleIds(input: { ruleIds: string[] }): Promise<AlertEvent[]>;
    withTx(tx: unknown): AlertEventsRepo;
}

