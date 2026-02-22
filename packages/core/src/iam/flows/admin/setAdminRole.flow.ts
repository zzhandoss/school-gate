import { RoleNotFoundError } from "../../../utils/errors.js";
import type { SetAdminRoleDeps, SetAdminRoleFlow } from "./setAdminRole.types.js";

export function createSetAdminRoleFlow(deps: SetAdminRoleDeps): SetAdminRoleFlow {
    return async function setAdminRole(input) {
        const role = await deps.rolesService.getById(input.roleId);
        if (!role) {
            throw new RoleNotFoundError();
        }

        await deps.adminsService.setRole({
            adminId: input.adminId,
            roleId: input.roleId,
            updatedAt: deps.clock.now(),
            actorId: input.changedByAdminId,
        });
    };
}