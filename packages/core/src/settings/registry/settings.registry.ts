import { accessEventsRegistry } from "./groups/accessEvents.registry.js";
import { monitoringRegistry } from "./groups/monitoring.registry.js";
import { notificationsRegistry } from "./groups/notifications.registry.js";
import { outboxRegistry } from "./groups/outbox.registry.js";
import { retentionRegistry } from "./groups/retention.registry.js";
import { workerRegistry } from "./groups/worker.registry.js";

export const settingsRegistry = {
    worker: workerRegistry,
    outbox: outboxRegistry,
    accessEvents: accessEventsRegistry,
    retention: retentionRegistry,
    monitoring: monitoringRegistry,
    notifications: notificationsRegistry,
} as const;

export type SettingsRegistry = typeof settingsRegistry;
export type SettingsGroup = keyof SettingsRegistry;

export type SettingsRegistryGroup = SettingsRegistry[SettingsGroup];
export type SettingsRegistryEntry = SettingsRegistryGroup["entries"][number];

export const settingsRegistryGroups: SettingsRegistryGroup[] = [
    workerRegistry,
    outboxRegistry,
    accessEventsRegistry,
    retentionRegistry,
    monitoringRegistry,
    notificationsRegistry,
];

export const settingsRegistryEntries: SettingsRegistryEntry[] = settingsRegistryGroups.map(
    (group) => group.entries
).flat();
