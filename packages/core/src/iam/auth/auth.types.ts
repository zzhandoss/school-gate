import type { Admin } from "../entities/admin.js";
import type { Permission } from "../constants/permissions.js";
import type { RefreshTokensService, RefreshTokenMeta } from "../services/refreshTokens.types.js";
import type { RolesService } from "../services/roles.types.js";
import type { AdminsService } from "../services/admins.types.js";
import type { JwtSigner } from "../../ports/jwtSigner.js";
import type { Clock } from "../../utils/common.types.js";
import type { AuthStrategy, AuthStrategyId, AuthStrategyInputById } from "./strategies/authStrategy.types.js";

export type AuthLoginInput = {
    strategy: AuthStrategyId;
    payload: AuthStrategyInputById[AuthStrategyId];
    meta?: RefreshTokenMeta | undefined;
};

export type AuthRefreshInput = {
    refreshToken: string;
    meta?: RefreshTokenMeta | undefined;
};

export type AuthTokens = {
    accessToken: string;
    accessExpiresAt: Date;
    refreshToken: string;
    refreshExpiresAt: Date;
    adminId: string;
    roleId: string;
    permissions: Permission[];
};

export type AuthService = {
    login(input: AuthLoginInput): Promise<AuthTokens | null>;
    rotateRefresh(input: AuthRefreshInput): Promise<AuthTokens>;
};

export type AuthServiceDeps = {
    strategies: AuthStrategy[];
    adminsService: AdminsService;
    rolesService: RolesService;
    refreshTokensService: RefreshTokensService;
    jwtSigner: JwtSigner;
    clock: Clock;
    accessTtlMs: number;
    refreshTtlMs: number;
};

export type AuthenticatedAdmin = {
    admin: Admin;
    permissions: Permission[];
};
