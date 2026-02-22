export type WorkerConfig = {
    pollMs: number;
    batch: number;
    autoResolvePersonByIin: boolean;
};

export type OutboxWorkerConfig = {
    pollMs: number;
    batch: number;
    maxAttempts: number;
    leaseMs: number;
    processingBy: string;
};

export type AccessEventsWorkerConfig = {
    pollMs: number;
    batch: number;
    retryDelayMs: number;
    leaseMs: number;
    maxAttempts: number;
    processingBy: string;
};

export type RetentionWorkerConfig = {
    pollMs: number;
    batch: number;
    accessEventsDays: number;
    auditLogsDays: number;
};

export type MonitoringConfig = {
    workerTtlMs: number;
};

export type NotificationsConfig = {
    parentTemplate: string;
    parentMaxAgeMs: number;
    alertMaxAgeMs: number;
};

export type WorkerRuntimeOverrides = {
    pollMs?: number;
    batch?: number;
    autoResolvePersonByIin?: boolean;
};

export type OutboxRuntimeOverrides = {
    pollMs?: number;
    batch?: number;
    maxAttempts?: number;
    leaseMs?: number;
    processingBy?: string;
};

export type AccessEventsRuntimeOverrides = {
    pollMs?: number;
    batch?: number;
    retryDelayMs?: number;
    leaseMs?: number;
    maxAttempts?: number;
    processingBy?: string;
};

export type RetentionRuntimeOverrides = {
    pollMs?: number;
    batch?: number;
    accessEventsDays?: number;
    auditLogsDays?: number;
};

export type MonitoringRuntimeOverrides = {
    workerTtlMs?: number;
};

export type NotificationsRuntimeOverrides = {
    parentTemplate?: string;
    parentMaxAgeMs?: number;
    alertMaxAgeMs?: number;
};

export type RuntimeSettings = {
    worker: WorkerRuntimeOverrides;
    outbox: OutboxRuntimeOverrides;
    accessEvents: AccessEventsRuntimeOverrides;
    retention: RetentionRuntimeOverrides;
    monitoring: MonitoringRuntimeOverrides;
    notifications: NotificationsRuntimeOverrides;
};

export const runtimeSettingKeys = {
    workerPollMs: "worker.poll_ms",
    workerBatch: "worker.batch",
    featureAutoResolvePerson: "feature.auto_resolve_person",
    outboxPollMs: "outbox.poll_ms",
    outboxBatch: "outbox.batch",
    outboxMaxAttempts: "outbox.max_attempts",
    outboxLeaseMs: "outbox.lease_ms",
    outboxProcessingBy: "outbox.processing_by",
    accessEventsPollMs: "access_events.poll_ms",
    accessEventsBatch: "access_events.batch",
    accessEventsRetryDelayMs: "access_events.retry_delay_ms",
    accessEventsLeaseMs: "access_events.lease_ms",
    accessEventsMaxAttempts: "access_events.max_attempts",
    accessEventsProcessingBy: "access_events.processing_by",
    retentionPollMs: "retention.poll_ms",
    retentionBatch: "retention.batch",
    retentionAccessEventsDays: "retention.access_events_days",
    retentionAuditLogsDays: "retention.audit_logs_days",
    monitoringWorkerTtlMs: "monitoring.worker_ttl_ms",
    notificationsParentTemplate: "notifications.parent_template",
    notificationsParentMaxAgeMs: "notifications.parent_max_age_ms",
    notificationsAlertMaxAgeMs: "notifications.alert_max_age_ms"
} as const;

export const runtimeSettingKeyList = Object.values(runtimeSettingKeys);
