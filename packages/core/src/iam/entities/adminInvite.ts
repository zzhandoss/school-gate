export type AdminInvite = {
    tokenHash: string;
    roleId: string;
    email: string | null;
    createdBy: string;
    expiresAt: Date;
    usedAt: Date | null;
    createdAt: Date;
};
