import type { SessionState } from "@/lib/auth/types";

export type SidebarBrandingVariant = "full" | "compact";

export type ShellAdminIdentity = {
    email: string
    role: string
    name: string
    avatarInitials: string
};

export function getSidebarBrandingVariant(isDesktopCollapsed: boolean): SidebarBrandingVariant {
    return isDesktopCollapsed ? "compact" : "full";
}

export function getAvatarInitials(name: string | null | undefined, email: string | undefined): string {
    const source = name?.trim() || email || "SA";
    const chunks = source.split(/\s+/).filter(Boolean);
    if (chunks.length >= 2) {
        return `${chunks[0][0]}${chunks[1][0]}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
}

export function getShellAdminIdentity(session: SessionState | null): ShellAdminIdentity {
    const email = session?.admin.email ?? "unknown@school-gate.local";
    const role = session?.admin.roleName ?? session?.admin.roleId ?? "unknown";
    const name = session?.admin.name?.trim() || email;

    return {
        email,
        role,
        name,
        avatarInitials: getAvatarInitials(session?.admin.name, session?.admin.email)
    };
}
