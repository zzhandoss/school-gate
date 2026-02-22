import type { AdminsService } from "../../services/admins.types.js";
import type { RolesService } from "../../services/roles.types.js";
import type { Clock } from "../../../utils/common.types.js";

export type SetAdminRoleInput = {
    adminId: string;
    roleId: string;
    changedByAdminId?: string | undefined;
};

export type SetAdminRoleFlow = (input: SetAdminRoleInput) => Promise<void>;

export type SetAdminRoleDeps = {
    adminsService: AdminsService;
    rolesService: RolesService;
    clock: Clock;
};