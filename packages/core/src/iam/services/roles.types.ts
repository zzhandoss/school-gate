import type { OutboxRepo } from "../../ports/outbox.js";
import type { Permission } from "../constants/permissions.js";
import type { Role } from "../entities/role.js";
import type { RolesRepo } from "../repos/roles.repo.js";
import type { Clock, IdGenerator } from "../../utils/index.js";

type CreateRoleInput = {
    id: string;
    name: string;
    permissions: Permission[];
    actorId?: string | undefined;
};

type UpdateRolePermissionsInput = {
    roleId: string;
    permissions: Permission[];
    actorId?: string | undefined;
};

export type RolesService = {
    withTx(tx: unknown): RolesService;
    createRole(input: CreateRoleInput): Promise<void>;
    updateRolePermissions(input: UpdateRolePermissionsInput): Promise<void>;
    listRoles(): Promise<Role[]>;
    listRolePermissions(roleId: string): Promise<Permission[]>;
    listPermissions(): Permission[];
    getById(id: string): Promise<Role | null>;
    getByName(name: string): Promise<Role | null>;
};

export type RolesServiceDeps = {
    rolesRepo: RolesRepo;
    outbox?: OutboxRepo | undefined;
    idGen?: IdGenerator | undefined;
    clock: Clock;
};