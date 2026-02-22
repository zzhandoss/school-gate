export const PERMISSIONS = [
    "admin.manage",
    "devices.read",
    "devices.write",
    "subscriptions.read",
    "subscriptions.review",
    "subscriptions.manage",
    "access_events.read",
    "access_events.map",
    "persons.read",
    "persons.write",
    "settings.read",
    "settings.write",
    "monitoring.read",
    "retention.manage",
] as const;

export type Permission = typeof PERMISSIONS[number];

export function isPermission(value: string): value is Permission {
    return (PERMISSIONS as readonly string[]).includes(value);
}
