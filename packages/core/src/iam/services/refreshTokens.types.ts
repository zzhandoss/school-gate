import type { OutboxRepo } from "../../ports/outbox.js";
import type { RefreshTokensRepo } from "../repos/refreshTokens.repo.js";
import type { PasswordHasher } from "../../ports/index.js";
import type { Clock, IdGenerator } from "../../utils/index.js";

export type RefreshTokenMeta = {
    deviceId?: string | null | undefined;
    ip?: string | null | undefined;
    userAgent?: string | null | undefined;
};

export type IssueRefreshTokenInput = {
    adminId: string;
    actorId?: string | undefined;
    expiresAt: Date;
    meta?: RefreshTokenMeta | undefined;
};

export type RotateRefreshTokenInput = {
    token: string;
    actorId?: string | undefined;
    expiresAt: Date;
    meta?: RefreshTokenMeta | undefined;
};

export type RevokeRefreshTokenInput = {
    token: string;
    actorId?: string | undefined;
};

export type RefreshTokenIssueResult = {
    refreshToken: string;
    refreshTokenId: string;
    expiresAt: Date;
};

export type RefreshTokenRotateResult = {
    refreshToken: string;
    refreshTokenId: string;
    expiresAt: Date;
    adminId: string;
};

export type RefreshTokensService = {
    issue(input: IssueRefreshTokenInput): Promise<RefreshTokenIssueResult>;
    rotate(input: RotateRefreshTokenInput): Promise<RefreshTokenRotateResult>;
    revoke(input: RevokeRefreshTokenInput): Promise<void>;
    withTx(tx: unknown): RefreshTokensService;
};

export type RefreshTokensServiceDeps = {
    refreshTokensRepo: RefreshTokensRepo;
    outbox?: OutboxRepo | undefined;
    passwordHasher: PasswordHasher;
    idGen: IdGenerator;
    clock: Clock;
};