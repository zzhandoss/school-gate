import type { AdminInvite } from "../entities/adminInvite.js";
import type { AdminInvitesRepo } from "../repos/adminInvites.repo.js";

type CreateAdminInviteInput = AdminInvite;

type MarkUsedInput = { tokenHash: string; usedAt: Date };

export type AdminInvitesService = {
    withTx(tx: unknown): AdminInvitesService;
    create(input: CreateAdminInviteInput): Promise<void>;
    getByTokenHash(tokenHash: string): Promise<AdminInvite | null>;
    markUsed(input: MarkUsedInput): Promise<void>;
};

export type AdminInvitesServiceDeps = {
    adminInvitesRepo: AdminInvitesRepo;
};
