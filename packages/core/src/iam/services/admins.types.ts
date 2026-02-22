import type { OutboxRepo } from "../../ports/outbox.js";
import type { IdGenerator } from "../../utils/common.types.js";
import type { Admin, AdminStatus } from "../entities/admin.js";
import type { AdminsRepo } from "../repos/admins.repo.js";
import type { PasswordHasher } from "../../ports/passwordHasher.js";

type ListInput = { limit: number; offset: number };

type CreateAdminInput = {
    id: string;
    email: string;
    passwordHash: string;
    roleId: string;
    status: AdminStatus;
    name?: string | null | undefined;
    tgUserId?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
};

type SetAdminStatusInput = { adminId: string; status: AdminStatus; updatedAt: Date; actorId?: string | undefined };

type SetAdminRoleInput = { adminId: string; roleId: string; updatedAt: Date; actorId?: string | undefined };

type SetAdminPasswordInput = { adminId: string; passwordHash: string; updatedAt: Date; actorId?: string | undefined };
type SetAdminProfileInput = { adminId: string; email: string; name: string | null; updatedAt: Date; actorId?: string | undefined };

type SetAdminTgUserInput = { adminId: string; tgUserId: string | null; updatedAt: Date; actorId?: string | undefined };

type AdminLoginInput = {
    email: string;
    password: string;
};

type AdminLoginResult = {
    admin: Admin;
};

export type AdminsService = {
    withTx(tx: unknown): AdminsService;
    create(input: CreateAdminInput): Promise<void>;
    getById(id: string): Promise<Admin | null>;
    getByEmail(email: string): Promise<Admin | null>;
    getByTgUserId(tgUserId: string): Promise<Admin | null>;
    list(input: ListInput): Promise<Admin[]>;
    setStatus(input: SetAdminStatusInput): Promise<void>;
    setRole(input: SetAdminRoleInput): Promise<void>;
    setPassword(input: SetAdminPasswordInput): Promise<void>;
    setProfile(input: SetAdminProfileInput): Promise<void>;
    setTgUserId(input: SetAdminTgUserInput): Promise<void>;
    login(input: AdminLoginInput): Promise<AdminLoginResult | null>;
};

export type AdminsServiceDeps = {
    adminsRepo: AdminsRepo;
    outbox?: OutboxRepo | undefined;
    idGen?: IdGenerator | undefined;
    passwordHasher: PasswordHasher;
};