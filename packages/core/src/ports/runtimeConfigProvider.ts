import type {
    AccessEventsRuntimeOverrides,
    AccessEventsWorkerConfig,
    MonitoringConfig,
    MonitoringRuntimeOverrides,
    NotificationsConfig,
    NotificationsRuntimeOverrides,
    OutboxRuntimeOverrides,
    OutboxWorkerConfig,
    RetentionRuntimeOverrides,
    RetentionWorkerConfig,
    WorkerConfig,
    WorkerRuntimeOverrides
} from "../config/runtimeConfig.js";

export type RuntimeConfigProvider = {
    getWorkerEnvConfig(): WorkerConfig;
    getOutboxEnvConfig(): OutboxWorkerConfig;
    getAccessEventsEnvConfig(): AccessEventsWorkerConfig;
    getRetentionEnvConfig(): RetentionWorkerConfig;
    getMonitoringEnvConfig(): MonitoringConfig;
    getNotificationsEnvConfig(): NotificationsConfig;
    applyWorkerOverrides(overrides: WorkerRuntimeOverrides): WorkerConfig;
    applyOutboxOverrides(overrides: OutboxRuntimeOverrides): OutboxWorkerConfig;
    applyAccessEventsOverrides(overrides: AccessEventsRuntimeOverrides): AccessEventsWorkerConfig;
    applyRetentionOverrides(overrides: RetentionRuntimeOverrides): RetentionWorkerConfig;
    applyMonitoringOverrides(overrides: MonitoringRuntimeOverrides): MonitoringConfig;
    applyNotificationsOverrides(overrides: NotificationsRuntimeOverrides): NotificationsConfig;
};
