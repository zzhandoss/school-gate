import type { Admin, AdminStatus } from "../entities/admin.js";

export interface AdminsRepo {
    create(input: {
        id: string;
        email: string;
        passwordHash: string;
        roleId: string;
        status: AdminStatus;
        name?: string | null;
        tgUserId?: string | null;
        createdAt: Date;
        updatedAt: Date;
    }): Promise<void>;
    getById(id: string): Promise<Admin | null>;
    getByEmail(email: string): Promise<Admin | null>;
    getByTgUserId(tgUserId: string): Promise<Admin | null>;
    list(input: { limit: number; offset: number }): Promise<Admin[]>;
    setPassword(input: { id: string; passwordHash: string; updatedAt: Date }): Promise<boolean>;
    setProfile(input: { id: string; email: string; name: string | null; updatedAt: Date }): Promise<boolean>;
    setTgUserId(input: { id: string; tgUserId: string | null; updatedAt: Date }): Promise<boolean>;
    setStatus(input: { id: string; status: AdminStatus; updatedAt: Date }): Promise<boolean>;
    setRole(input: { id: string; roleId: string; updatedAt: Date }): Promise<boolean>;
    withTx(tx: unknown): AdminsRepo;
}
