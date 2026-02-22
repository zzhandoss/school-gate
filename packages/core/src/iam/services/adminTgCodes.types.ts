import type { AdminTgCode, AdminTgCodePurpose } from "../entities/adminTgCode.js";
import type { AdminTgCodesRepo } from "../repos/adminTgCodes.repo.js";

export type AdminTgCodesService = {
    withTx(tx: unknown): AdminTgCodesService;
    create(input: { codeHash: string; adminId: string; purpose: AdminTgCodePurpose; expiresAt: Date }): Promise<void>;
    getByCodeHash(codeHash: string): Promise<AdminTgCode | null>;
    markUsed(input: { codeHash: string; usedAt: Date }): Promise<void>;
};

export type AdminTgCodesServiceDeps = {
    adminTgCodesRepo: AdminTgCodesRepo;
};
