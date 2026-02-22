import type { AdminTgCode, AdminTgCodePurpose } from "../entities/adminTgCode.js";

export interface AdminTgCodesRepo {
    create(input: {
        codeHash: string;
        adminId: string;
        purpose: AdminTgCodePurpose;
        expiresAt: Date;
    }): Promise<void>;
    getByCodeHash(codeHash: string): Promise<AdminTgCode | null>;
    markUsed(input: { codeHash: string; usedAt: Date }): Promise<boolean>;
    withTx(tx: unknown): AdminTgCodesRepo;
}
