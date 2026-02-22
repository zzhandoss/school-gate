import {
    BellRing,
    ClipboardList,
    Cpu,
    Fingerprint,
    HardDrive,
    IdCard,
    LayoutDashboard,
    PlugZap,
    Shield,
    SlidersHorizontal,
    UsersRound
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { i18n } from "@/lib/i18n";

type SidebarNavigationInput = {
    pathname: string;
    permissions: Array<string>;
};

export type SidebarNavItem = {
    id: string;
    label: string;
    labelKey: string;
    to: string;
    icon: LucideIcon;
    isActive: (pathname: string) => boolean;
    visible: boolean;
};

export type SidebarNavGroup = {
    id: string;
    title: string;
    titleKey: string;
    items: Array<SidebarNavItem>;
    visible: boolean;
};

function hasPermission(permissions: Array<string>, permission: string) {
    return permissions.includes(permission);
}

function hasAnyPermission(permissions: Array<string>, required: Array<string>) {
    return required.some((permission) => hasPermission(permissions, permission));
}

export function buildSidebarNavigation(input: SidebarNavigationInput): Array<SidebarNavGroup> {
    const canManageAdmins = hasPermission(input.permissions, "admin.manage");
    const canReadDevices = hasPermission(input.permissions, "devices.read");
    const canSeeSubscriptionRequests = hasAnyPermission(input.permissions, [
        "subscriptions.read",
        "subscriptions.review"
    ]);
    const canSeeAccessEvents = hasAnyPermission(input.permissions, [
        "access_events.read",
        "access_events.map"
    ]);
    const canReadPersons = hasPermission(input.permissions, "persons.read");
    const canReadMonitoring = hasPermission(input.permissions, "monitoring.read");

    const groups: Array<SidebarNavGroup> = [
        {
            id: "main",
            title: i18n.t("app.nav.main"),
            titleKey: "app.nav.main",
            visible: true,
            items: [
                {
                    id: "dashboard",
                    label: i18n.t("app.nav.dashboard"),
                    labelKey: "app.nav.dashboard",
                    to: "/dashboard",
                    icon: LayoutDashboard,
                    isActive: (pathname) => pathname === "/dashboard",
                    visible: true
                },
                {
                    id: "subscription-requests",
                    label: i18n.t("app.nav.subscriptionRequests"),
                    labelKey: "app.nav.subscriptionRequests",
                    to: "/subscription-requests",
                    icon: ClipboardList,
                    isActive: (pathname) => pathname === "/subscription-requests",
                    visible: canSeeSubscriptionRequests
                },
                {
                    id: "access-events",
                    label: i18n.t("app.nav.accessEvents"),
                    labelKey: "app.nav.accessEvents",
                    to: "/access-events",
                    icon: Fingerprint,
                    isActive: (pathname) => pathname === "/access-events",
                    visible: canSeeAccessEvents
                },
                {
                    id: "persons",
                    label: i18n.t("app.nav.persons"),
                    labelKey: "app.nav.persons",
                    to: "/persons",
                    icon: IdCard,
                    isActive: (pathname) => pathname.startsWith("/persons"),
                    visible: canReadPersons
                }
            ]
        },
        {
            id: "monitoring",
            title: i18n.t("app.nav.monitoring"),
            titleKey: "app.nav.monitoring",
            visible: true,
            items: [
                {
                    id: "alerts",
                    label: i18n.t("app.nav.alerts"),
                    labelKey: "app.nav.alerts",
                    to: "/alerts",
                    icon: BellRing,
                    isActive: (pathname) => pathname === "/alerts",
                    visible: true
                },
                {
                    id: "audit-logs",
                    label: i18n.t("app.nav.auditLogs"),
                    labelKey: "app.nav.auditLogs",
                    to: "/audit-logs",
                    icon: ClipboardList,
                    isActive: (pathname) => pathname === "/audit-logs",
                    visible: canReadMonitoring
                },
                {
                    id: "settings",
                    label: i18n.t("app.nav.settings"),
                    labelKey: "app.nav.settings",
                    to: "/settings",
                    icon: SlidersHorizontal,
                    isActive: (pathname) => pathname === "/settings",
                    visible: true
                }
            ]
        },
        {
            id: "administration",
            title: i18n.t("app.nav.administration"),
            titleKey: "app.nav.administration",
            visible: canManageAdmins,
            items: [
                {
                    id: "admins",
                    label: i18n.t("app.nav.admins"),
                    labelKey: "app.nav.admins",
                    to: "/admins",
                    icon: UsersRound,
                    isActive: (pathname) => pathname === "/admins",
                    visible: canManageAdmins
                },
                {
                    id: "roles",
                    label: i18n.t("app.nav.roles"),
                    labelKey: "app.nav.roles",
                    to: "/admins/roles",
                    icon: Shield,
                    isActive: (pathname) => pathname === "/admins/roles",
                    visible: canManageAdmins
                }
            ]
        },
        {
            id: "device-operations",
            title: i18n.t("app.nav.deviceOperations"),
            titleKey: "app.nav.deviceOperations",
            visible: canReadDevices,
            items: [
                {
                    id: "devices",
                    label: i18n.t("app.nav.devices"),
                    labelKey: "app.nav.devices",
                    to: "/devices",
                    icon: HardDrive,
                    isActive: (pathname) => pathname === "/devices",
                    visible: canReadDevices
                },
                {
                    id: "adapters",
                    label: i18n.t("app.nav.adapters"),
                    labelKey: "app.nav.adapters",
                    to: "/devices/adapters",
                    icon: PlugZap,
                    isActive: (pathname) => pathname === "/devices/adapters",
                    visible: canReadDevices
                },
                {
                    id: "ds-monitoring",
                    label: i18n.t("app.nav.dsMonitoring"),
                    labelKey: "app.nav.dsMonitoring",
                    to: "/devices/monitoring",
                    icon: Cpu,
                    isActive: (pathname) => pathname === "/devices/monitoring",
                    visible: canReadDevices
                }
            ]
        }
    ];

    return groups
        .filter((group) => group.visible)
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => item.visible)
        }))
        .filter((group) => group.items.length > 0);
}
