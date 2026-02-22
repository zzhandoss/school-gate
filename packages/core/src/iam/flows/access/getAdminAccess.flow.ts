import { AdminDisabledError, AdminNotFoundError, RoleNotFoundError } from "../../../utils/errors.js";
import type { GetAdminAccessDeps, GetAdminAccessFlow } from "./getAdminAccess.types.js";

export function createGetAdminAccessFlow(deps: GetAdminAccessDeps): GetAdminAccessFlow {
    return async function getAdminAccess(adminId) {
        const admin = await deps.adminsService.getById(adminId);
        if (!admin) {
            throw new AdminNotFoundError();
        }

        if (admin.status !== "active") {
            throw new AdminDisabledError();
        }

        const role = await deps.rolesService.getById(admin.roleId);
        if (!role) {
            throw new RoleNotFoundError();
        }

        const permissions = await deps.rolesService.listRolePermissions(admin.roleId);
        return {
            adminId: admin.id,
            roleId: admin.roleId,
            permissions,
        };
    };
}

