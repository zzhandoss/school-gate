import type { PasswordReset } from "../entities/passwordReset.js";
import type { PasswordResetsRepo } from "../repos/passwordResets.repo.js";

type CreatePasswordResetInput = PasswordReset;

type MarkUsedInput = { tokenHash: string; usedAt: Date };

export type PasswordResetsService = {
    withTx(tx: unknown): PasswordResetsService;
    create(input: CreatePasswordResetInput): Promise<void>;
    getByTokenHash(tokenHash: string): Promise<PasswordReset | null>;
    markUsed(input: MarkUsedInput): Promise<void>;
};

export type PasswordResetsServiceDeps = {
    passwordResetsRepo: PasswordResetsRepo;
};
