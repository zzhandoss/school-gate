import type { Admin } from "../../../iam/index.js";

export type AdminsQueryPort = {
    getById(id: string): Promise<Admin | null>;
    getByEmail(email: string): Promise<Admin | null>;
    getByTgUserId(tgUserId: string): Promise<Admin | null>;
    list(input: { limit: number; offset: number }): Promise<Admin[]>;
};
