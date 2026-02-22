import { AdminDisabledError, AdminNotFoundError } from "../../utils/errors.js";
import type { Permission } from "../constants/permissions.js";
import type { AuthService, AuthServiceDeps, AuthTokens, AuthenticatedAdmin } from "./auth.types.js";
import type { AuthStrategyId } from "./strategies/authStrategy.types.js";

function resolveStrategy(deps: AuthServiceDeps, id: AuthStrategyId) {
    const strategy = deps.strategies.find((item) => item.id === id);
    if (!strategy) {
        throw new Error(`Auth strategy not registered: ${id}`);
    }
    return strategy;
}

async function loadAccess(deps: AuthServiceDeps, adminId: string): Promise<AuthenticatedAdmin> {
    const admin = await deps.adminsService.getById(adminId);
    if (!admin) {
        throw new AdminNotFoundError();
    }
    if (admin.status !== "active") {
        throw new AdminDisabledError();
    }

    const permissions = await deps.rolesService.listRolePermissions(admin.roleId);
    return { admin, permissions };
}

async function signAccessToken(
    deps: AuthServiceDeps,
    adminId: string,
    roleId: string,
    permissions: Permission[]
): Promise<{ accessToken: string; accessExpiresAt: Date }> {
    const now = deps.clock.now();
    const accessExpiresAt = new Date(now.getTime() + deps.accessTtlMs);

    const accessToken = await deps.jwtSigner.signAdminAccessToken({
        payload: { adminId, roleId, permissions },
        issuedAt: now,
        expiresAt: accessExpiresAt,
    });

    return { accessToken, accessExpiresAt };
}

async function issueTokens(
    deps: AuthServiceDeps,
    adminId: string,
    roleId: string,
    permissions: Permission[],
    meta?: { deviceId?: string | undefined | null; ip?: string | undefined | null; userAgent?: string | undefined | null }
): Promise<AuthTokens> {
    const refreshExpiresAt = new Date(deps.clock.now().getTime() + deps.refreshTtlMs);

    const access = await signAccessToken(deps, adminId, roleId, permissions);
    const refresh = await deps.refreshTokensService.issue({
        adminId,
        expiresAt: refreshExpiresAt,
        meta,
    });

    return {
        accessToken: access.accessToken,
        accessExpiresAt: access.accessExpiresAt,
        refreshToken: refresh.refreshToken,
        refreshExpiresAt: refresh.expiresAt,
        adminId,
        roleId,
        permissions,
    };
}

export function createAuthService(deps: AuthServiceDeps): AuthService {
    return {
        async login(input) {
            const strategy = resolveStrategy(deps, input.strategy);
            const result = await strategy.authenticate(input.payload as any);
            if (!result) {
                return null;
            }
            const access = await loadAccess(deps, result.admin.id);
            return issueTokens(deps, access.admin.id, access.admin.roleId, access.permissions, input.meta);
        },
        async rotateRefresh(input) {
            const refresh = await deps.refreshTokensService.rotate({
                token: input.refreshToken,
                expiresAt: new Date(deps.clock.now().getTime() + deps.refreshTtlMs),
                meta: input.meta,
            });

            const access = await loadAccess(deps, refresh.adminId);
            const signed = await signAccessToken(
                deps,
                access.admin.id,
                access.admin.roleId,
                access.permissions
            );

            return {
                accessToken: signed.accessToken,
                accessExpiresAt: signed.accessExpiresAt,
                refreshToken: refresh.refreshToken,
                refreshExpiresAt: refresh.expiresAt,
                adminId: access.admin.id,
                roleId: access.admin.roleId,
                permissions: access.permissions,
            };
        },
    };
}
