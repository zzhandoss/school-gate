import type { AdminInvite } from "../entities/adminInvite.js";

export interface AdminInvitesRepo {
    create(input: AdminInvite): Promise<void>;
    getByTokenHash(tokenHash: string): Promise<AdminInvite | null>;
    markUsed(input: { tokenHash: string; usedAt: Date }): Promise<boolean>;
    withTx(tx: unknown): AdminInvitesRepo;
}
