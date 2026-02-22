import { enqueueAuditRequested } from "../../audit/events/auditRequested.js";
import { PERMISSIONS } from "../constants/permissions.js";
import { RoleNotFoundError } from "../../utils/errors.js";
import type { RolesService, RolesServiceDeps } from "./roles.types.js";

export function createRolesService(deps: RolesServiceDeps): RolesService {
    return {
        withTx(tx: unknown) {
            return createRolesService({
                ...deps,
                rolesRepo: deps.rolesRepo.withTx(tx),
                outbox: deps.outbox,
                idGen: deps.idGen,
            });
        },



        async createRole(input) {
            const now = deps.clock.now();
            await deps.rolesRepo.upsert({
                id: input.id,
                name: input.name,
                createdAt: now,
                updatedAt: now,
            });
            await deps.rolesRepo.replacePermissions({
                roleId: input.id,
                permissions: input.permissions,
            });
            if (deps.outbox && deps.idGen) {
                enqueueAuditRequested({
                    outbox: deps.outbox,
                    id: deps.idGen.nextId(),
                    actorId: input.actorId ?? "system:role_create",
                    action: "role_created",
                    entityType: "role",
                    entityId: input.id,
                    at: now,
                    meta: { name: input.name, permissions: input.permissions },
                });
            }
        },

        async updateRolePermissions(input) {
            const role = await deps.rolesRepo.getById(input.roleId);
            if (!role) {
                throw new RoleNotFoundError();
            }

            const updatedAt = deps.clock.now();
            await deps.rolesRepo.replacePermissions({
                roleId: input.roleId,
                permissions: input.permissions,
            });
            if (deps.outbox && deps.idGen) {
                enqueueAuditRequested({
                    outbox: deps.outbox,
                    id: deps.idGen.nextId(),
                    actorId: input.actorId ?? "system:role_permissions_update",
                    action: "role_permissions_updated",
                    entityType: "role",
                    entityId: input.roleId,
                    at: updatedAt,
                    meta: { permissions: input.permissions },
                });
            }
        },

        listRoles() {
            return deps.rolesRepo.list();
        },

        listRolePermissions(roleId) {
            return deps.rolesRepo.listPermissions(roleId);
        },

        listPermissions() {
            return [...PERMISSIONS];
        },

        getById(id) {
            return deps.rolesRepo.getById(id);
        },

        getByName(name) {
            return deps.rolesRepo.getByName(name);
        },
    };
}
