import { enqueueAuditRequested } from "../../audit/events/auditRequested.js";
import {
    RefreshTokenAlreadyUsedError,
    RefreshTokenExpiredError,
    RefreshTokenInvalidError,
    RefreshTokenRevokedError
} from "../../utils/errors.js";
import type {
    RefreshTokensService,
    RefreshTokensServiceDeps,
    RefreshTokenIssueResult,
    RefreshTokenRotateResult
} from "./refreshTokens.types.js";

const TOKEN_DELIMITER = ".";

function parseToken(token: string): { id: string; secret: string } {
    const parts = token.split(TOKEN_DELIMITER);
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new RefreshTokenInvalidError();
    }
    return {
        id: parts[0], secret: parts[1] };
}

function normalizeMeta(meta: { deviceId?: string | null | undefined; ip?: string | null | undefined; userAgent?: string | null | undefined } | undefined) {
    return {

        deviceId: meta?.deviceId ?? null,
        ip: meta?.ip ?? null,
        userAgent: meta?.userAgent ?? null
    };
}

export function createRefreshTokensService(deps: RefreshTokensServiceDeps): RefreshTokensService {
    return {
        withTx(tx: unknown) {
            return createRefreshTokensService({
                ...deps,
                refreshTokensRepo: deps.refreshTokensRepo.withTx(tx)
            });
        },



        async issue(input): Promise<RefreshTokenIssueResult> {
            const tokenId = deps.idGen.nextId();
            const secret = deps.idGen.nextId();
            const tokenHash = await deps.passwordHasher.hash(secret);
            const createdAt = deps.clock.now();
            const meta = normalizeMeta(input.meta);

            await deps.refreshTokensRepo.create({
                id: tokenId,
                adminId: input.adminId,
                tokenHash,
                createdAt,
                expiresAt: input.expiresAt,
                deviceId: meta.deviceId,
                ip: meta.ip,
                userAgent: meta.userAgent
            });

            if (deps.outbox) {
                enqueueAuditRequested({
                    outbox: deps.outbox,
                    id: deps.idGen.nextId(),
                    actorId: input.actorId ?? `admin:${input.adminId}`,
                    action: "refresh_token_issued",
                    entityType: "refresh_token",
                    entityId: tokenId,
                    at: createdAt,
                    meta: { adminId: input.adminId, expiresAt: input.expiresAt.toISOString() }
                });
            }

            return {

                refreshToken: `${tokenId}${TOKEN_DELIMITER}${secret}`,
                refreshTokenId: tokenId,
                expiresAt: input.expiresAt
            };
        },
        async rotate(input): Promise<RefreshTokenRotateResult> {
            const { id, secret } = parseToken(input.token);
            const record = await deps.refreshTokensRepo.getById(id);
            if (!record) {
                throw new RefreshTokenInvalidError();
            }

            if (record.revokedAt) {
                throw new RefreshTokenRevokedError();
            }

            if (record.rotatedAt) {
                throw new RefreshTokenAlreadyUsedError();
            }

            if (record.expiresAt.getTime() <= deps.clock.now().getTime()) {
                throw new RefreshTokenExpiredError();
            }

            const ok = await deps.passwordHasher.verify(record.tokenHash, secret);
            if (!ok) {
                throw new RefreshTokenInvalidError();
            }

            const tokenId = deps.idGen.nextId();
            const newSecret = deps.idGen.nextId();
            const tokenHash = await deps.passwordHasher.hash(newSecret);
            const createdAt = deps.clock.now();
            const meta = normalizeMeta(input.meta);

            await deps.refreshTokensRepo.create({
                id: tokenId,
                adminId: record.adminId,
                tokenHash,
                createdAt,
                expiresAt: input.expiresAt,
                deviceId: meta.deviceId,
                ip: meta.ip,
                userAgent: meta.userAgent
            });

            await deps.refreshTokensRepo.markRotated({
                id: record.id,
                rotatedAt: createdAt,
                replacedBy: tokenId
            });

            if (deps.outbox) {
                enqueueAuditRequested({
                    outbox: deps.outbox,
                    id: deps.idGen.nextId(),
                    actorId: input.actorId ?? `admin:${record.adminId}`,
                    action: "refresh_token_rotated",
                    entityType: "refresh_token",
                    entityId: record.id,
                    at: createdAt,
                    meta: { replacedBy: tokenId, adminId: record.adminId }
                });
            }

            return {

                refreshToken: `${tokenId}${TOKEN_DELIMITER}${newSecret}`,
                refreshTokenId: tokenId,
                expiresAt: input.expiresAt,
                adminId: record.adminId
            };
        },
        async revoke(input): Promise<void> {
            const { id, secret } = parseToken(input.token);
            const record = await deps.refreshTokensRepo.getById(id);
            if (!record) {
                throw new RefreshTokenInvalidError();
            }

            const ok = await deps.passwordHasher.verify(record.tokenHash, secret);
            if (!ok) {
                throw new RefreshTokenInvalidError();
            }

            if (record.revokedAt) {
                return;
            }

            const revokedAt = deps.clock.now();
            await deps.refreshTokensRepo.markRevoked({ id, revokedAt });
            if (deps.outbox) {
                enqueueAuditRequested({
                    outbox: deps.outbox,
                    id: deps.idGen.nextId(),
                    actorId: input.actorId ?? `admin:${record.adminId}`,
                    action: "refresh_token_revoked",
                    entityType: "refresh_token",
                    entityId: record.id,
                    at: revokedAt,
                    meta: { adminId: record.adminId }
                });
            }
        }
    };
}