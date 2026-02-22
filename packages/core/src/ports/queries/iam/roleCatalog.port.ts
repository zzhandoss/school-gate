import type { Permission } from "../../../iam/index.js";
import type { Role } from "../../../iam/index.js";

export type RoleCatalogQueryPort = {
    getById(id: string): Promise<Role | null>;
    getByName(name: string): Promise<Role | null>;
    list(): Promise<Role[]>;
    listRolePermissions(roleId: string): Promise<Permission[]>;
    listPermissions(): Permission[];
};
