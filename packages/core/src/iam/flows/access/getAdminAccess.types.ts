import type { Permission } from "../../constants/permissions.js";
import type { AdminsService } from "../../services/admins.types.js";
import type { RolesService } from "../../services/roles.types.js";

export type AdminAccess = {
    adminId: string;
    roleId: string;
    permissions: Permission[];
};

export type GetAdminAccessFlow = (adminId: string) => Promise<AdminAccess>;

export type GetAdminAccessDeps = {
    adminsService: AdminsService;
    rolesService: RolesService;
};

