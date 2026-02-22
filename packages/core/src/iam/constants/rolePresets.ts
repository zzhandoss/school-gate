import { PERMISSIONS, type Permission } from "./permissions.js";

export type RolePreset = {
    name: string;
    permissions: Permission[];
};

export const ROLE_PRESETS: RolePreset[] = [
    {
        name: "super_admin",
        permissions: [...PERMISSIONS]
    },
    {
        name: "manager",
        permissions: [
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
            "monitoring.read"
        ]
    },
    {
        name: "device_manager",
        permissions: ["devices.read", "devices.write", "monitoring.read"]
    }
];

export function getRolePreset(name: string): RolePreset | null {
    return ROLE_PRESETS.find((preset) => preset.name === name) ?? null;
}
