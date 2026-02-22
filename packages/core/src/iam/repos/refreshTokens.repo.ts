import type { RefreshToken } from "../entities/refreshToken.js";

export interface RefreshTokensRepo {
    create(input: {
        id: string;
        adminId: string;
        tokenHash: string;
        createdAt: Date;
        expiresAt: Date;
        deviceId?: string | null;
        ip?: string | null;
        userAgent?: string | null;
    }): Promise<void>;

    getById(id: string): Promise<RefreshToken | null>;

    markRotated(input: {
        id: string;
        rotatedAt: Date;
        replacedBy: string;
    }): Promise<void>;

    markRevoked(input: { id: string; revokedAt: Date }): Promise<void>;
    withTx(tx: unknown): RefreshTokensRepo;
}

