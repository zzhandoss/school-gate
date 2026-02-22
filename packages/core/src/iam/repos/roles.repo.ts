import type { Role } from "../entities/role.js";
import type { Permission } from "../constants/permissions.js";

export interface RolesRepo {
    upsert(input: { id: string; name: string; createdAt: Date; updatedAt: Date }): Promise<void>;
    getById(id: string): Promise<Role | null>;
    getByName(name: string): Promise<Role | null>;
    list(): Promise<Role[]>;
    listPermissions(roleId: string): Promise<Permission[]>;
    replacePermissions(input: { roleId: string; permissions: Permission[] }): Promise<void>;
    withTx(tx: unknown): RolesRepo;
}
