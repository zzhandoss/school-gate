import type {
    AlertRule,
    AlertSubscription,
    CreateAlertRuleInput,
    DeleteAlertRuleResult,
    ListAlertEventsInput,
    ListAlertEventsResult,
    UpdateAlertRuleInput
} from "./types";
import { requestApi } from "@/lib/api/client";

type ListRulesResponse = {
    rules: Array<AlertRule>
};

type ListEventsResponse = ListAlertEventsResult;

type ListSubscriptionsResponse = {
    subscriptions: Array<AlertSubscription>
};

export async function getAlertRules(params?: {
    onlyEnabled?: boolean
    limit?: number
}) {
    const query = new URLSearchParams({
        limit: String(params?.limit ?? 100),
        offset: "0"
    });
    if (params?.onlyEnabled !== undefined) {
        query.set("onlyEnabled", String(params.onlyEnabled));
    }

    const response = await requestApi<ListRulesResponse>(`/api/alerts/rules?${query.toString()}`);
    return response.rules;
}

export async function getAlertEvents(params?: ListAlertEventsInput) {
    const query = new URLSearchParams({
        limit: String(params?.limit ?? 30),
        offset: String(params?.offset ?? 0)
    });
    if (params?.status) {
        query.set("status", params.status);
    }

    const response = await requestApi<ListEventsResponse>(`/api/alerts/events?${query.toString()}`);
    return response;
}

export async function getMyAlertSubscriptions(adminId: string) {
    const query = new URLSearchParams({
        limit: "200",
        offset: "0",
        adminId
    });
    const response = await requestApi<ListSubscriptionsResponse>(
        `/api/alerts/subscriptions?${query.toString()}`
    );
    return response.subscriptions;
}

export async function setMyAlertSubscription(input: {
    adminId: string
    ruleId: string
    isEnabled: boolean
}) {
    await requestApi("/api/alerts/subscriptions", {
        method: "POST",
        body: input
    });
}

export async function createAlertRule(input: CreateAlertRuleInput) {
    return requestApi<{ ruleId: string }>("/api/alerts/rules", {
        method: "POST",
        body: input
    });
}

export async function updateAlertRule(ruleId: string, input: UpdateAlertRuleInput) {
    await requestApi(`/api/alerts/rules/${ruleId}`, {
        method: "PATCH",
        body: input
    });
}

export async function deleteAlertRule(ruleId: string) {
    return requestApi<DeleteAlertRuleResult>(`/api/alerts/rules/${ruleId}`, {
        method: "DELETE"
    });
}
