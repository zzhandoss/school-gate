import type { AlertEvent } from "../entities/alertEvents.types.js";
import type { AlertEventsRepo, CreateAlertEventInput, ListAlertEventsInput } from "../repos/alertEvents.repo.js";

export type AlertEventsService = {
    insertSync(input: CreateAlertEventInput): void;
    list(input: ListAlertEventsInput): Promise<AlertEvent[]>;
    count(input: Omit<ListAlertEventsInput, "limit" | "offset">): Promise<number>;
    listLatestByRuleIds(input: { ruleIds: string[] }): Promise<AlertEvent[]>;
    withTx(tx: unknown): AlertEventsService;
};

export type AlertEventsServiceDeps = {
    eventsRepo: AlertEventsRepo;
};

