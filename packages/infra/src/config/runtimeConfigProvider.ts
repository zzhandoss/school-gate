import {
    getAccessEventsWorkerConfig,
    getMonitoringConfig,
    getNotificationsConfig,
    getOutboxWorkerConfig,
    getRetentionWorkerConfig,
    getWorkerConfig,
    loadEnv,
} from "@school-gate/config";
import type { RuntimeConfigProvider } from "@school-gate/core";

export function createRuntimeConfigProvider(): RuntimeConfigProvider {
    loadEnv();
    return {
        getWorkerEnvConfig: () => getWorkerConfig(),
        getOutboxEnvConfig: () => getOutboxWorkerConfig(),
        getAccessEventsEnvConfig: () => getAccessEventsWorkerConfig(),
        getRetentionEnvConfig: () => getRetentionWorkerConfig(),
        getMonitoringEnvConfig: () => getMonitoringConfig(),
        getNotificationsEnvConfig: () => getNotificationsConfig(),
        applyWorkerOverrides: (overrides) => getWorkerConfig(overrides),
        applyOutboxOverrides: (overrides) => getOutboxWorkerConfig(overrides),
        applyAccessEventsOverrides: (overrides) => getAccessEventsWorkerConfig(overrides),
        applyRetentionOverrides: (overrides) => getRetentionWorkerConfig(overrides),
        applyMonitoringOverrides: (overrides) => getMonitoringConfig(overrides),
        applyNotificationsOverrides: (overrides) => getNotificationsConfig(overrides),
    };
}
