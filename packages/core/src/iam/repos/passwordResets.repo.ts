import type { PasswordReset } from "../entities/passwordReset.js";

export interface PasswordResetsRepo {
    create(input: PasswordReset): Promise<void>;
    getByTokenHash(tokenHash: string): Promise<PasswordReset | null>;
    markUsed(input: { tokenHash: string; usedAt: Date }): Promise<boolean>;
    withTx(tx: unknown): PasswordResetsRepo;
}
