export type AlertSeverity = "warning" | "critical";
export type AlertRuleType =
  | "worker_stale"
  | "outbox_backlog"
  | "bot_down"
  | "access_event_lag"
  | "error_spike"
  | "device_service_down"
  | "adapter_down";

export type AlertEventStatus = "triggered" | "resolved";

export type AlertRule = {
    id: string
    name: string
    type: AlertRuleType
    severity: AlertSeverity
    isEnabled: boolean
    config: Record<string, unknown>
    createdAt: string
    updatedAt: string
};

export type AlertSubscription = {
    adminId: string
    ruleId: string
    isEnabled: boolean
    createdAt: string
    updatedAt: string
};

export type AlertEvent = {
    id: string
    ruleId: string
    snapshotId: string | null
    status: AlertEventStatus
    severity: AlertSeverity
    message: string
    details: Record<string, unknown> | null
    createdAt: string
};

export type AlertsPage = {
    limit: number
    offset: number
    total: number
};

export type ListAlertEventsInput = {
    status?: AlertEventStatus
    limit?: number
    offset?: number
};

export type ListAlertEventsResult = {
    events: Array<AlertEvent>
    page: AlertsPage
};

export type DeleteAlertRuleResult = {
    ruleId: string
    deleted: true
};

export type CreateAlertRuleInput = {
    name: string
    type: AlertRuleType
    severity: AlertSeverity
    isEnabled: boolean
    config: Record<string, unknown>
};

export type UpdateAlertRuleInput = {
    name: string
    severity: AlertSeverity
    isEnabled: boolean
    config: Record<string, unknown>
};
