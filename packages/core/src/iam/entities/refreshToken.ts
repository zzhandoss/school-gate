export type RefreshToken = {
    id: string;
    adminId: string;
    tokenHash: string;
    createdAt: Date;
    expiresAt: Date;
    rotatedAt: Date | null;
    revokedAt: Date | null;
    replacedBy: string | null;
    deviceId: string | null;
    ip: string | null;
    userAgent: string | null;
};
