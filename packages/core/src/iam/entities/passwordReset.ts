export type PasswordReset = {
    tokenHash: string;
    adminId: string;
    expiresAt: Date;
    usedAt: Date | null;
    createdAt: Date;
};
