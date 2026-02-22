export type AdminStatus = "pending" | "active" | "disabled";

export type AdminItem = {
    id: string
    email: string
    roleId: string
    status: AdminStatus
    name: string | null
    tgUserId: string | null
    createdAt: string
    updatedAt: string
};

export type AdminRole = {
    id: string
    name: string
    createdAt: string
    updatedAt: string
};

export type ListAdminsInput = {
    limit?: number
    offset?: number
};

export type SetAdminStatusInput = {
    status: Extract<AdminStatus, "active" | "disabled">
};

export type SetAdminRoleInput = {
    roleId: string
};

export type CreateAdminPasswordResetInput = {
    expiresInMs: number
};

export type CreateAdminInviteInput = {
    email: string
    expiresInMs: number
    roleId: string
};

export type CreateRoleInput = {
    name: string
    permissions: Array<string>
};

export type UpdateRolePermissionsInput = {
    permissions: Array<string>
};
