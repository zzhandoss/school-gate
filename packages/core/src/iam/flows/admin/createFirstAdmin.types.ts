import type { OutboxRepo } from "../../../ports/outbox.js";
import type { PasswordHasher } from "../../../ports/passwordHasher.js";
import type { Clock, IdGenerator } from "../../../utils/common.types.js";
import type { AdminsService } from "../../services/admins.types.js";
import type { RolesService } from "../../services/roles.types.js";

export type CreateFirstAdminInput = {
    email: string;
    password: string;
    name?: string | null | undefined;
};

export type CreateFirstAdminResult = {
    adminId: string;
    roleId: string;
};

export type CreateFirstAdminFlow = (input: CreateFirstAdminInput) => Promise<CreateFirstAdminResult>;

export type CreateFirstAdminDeps = {
    adminsService: AdminsService;
    rolesService: RolesService;
    passwordHasher: PasswordHasher;
    outbox: OutboxRepo;
    idGen: IdGenerator;
    clock: Clock;
};