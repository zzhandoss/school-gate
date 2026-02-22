import type { AdminAuthModule } from "../../delivery/http/routes/adminAuth.routes.js";
import { createAdminAuth } from "../../delivery/http/middleware/adminAuth.js";
import { createAdminJwtSigner } from "../../delivery/http/adminJwt.js";
import type { ApiRuntime } from "../../runtime/createRuntime.js";
import type {
    AdminLoginResultDto,
    AdminSessionResultDto,
    AdminRefreshResultDto,
    RequestTelegramLoginCodeResultDto,
    TelegramOtpLoginResultDto,
    BootstrapFirstAdminDto,
    BootstrapFirstAdminResultDto,
    ConfirmPasswordResetResultDto,
    CreateAdminInviteResultDto,
    CreateRoleResultDto,
    CreateTelegramLinkCodeResultDto,
    LinkTelegramByCodeResultDto,
    UnlinkTelegramResultDto,
    ListAdminPermissionsResultDto,
    ListAdminRolePermissionsResultDto,
    ListAdminRolesResultDto,
    RequestPasswordResetResultDto,
    UpdateMyProfileDto,
    UpdateMyProfileResultDto,
    ChangeMyPasswordDto,
    ChangeMyPasswordResultDto
} from "@school-gate/contracts";
import { InvalidCredentialsError } from "../errors/invalidCredentials.error.js";
import {
    createAcceptAdminInviteFlow,
    createAdminInvitesService,
    createAdminsService,
    createAdminTgCodesService,
    createAuthService,
    createConfirmPasswordResetFlow,
    createCreateAdminInviteFlow,
    createCreateFirstAdminFlow,
    createCreateTelegramLoginCodeFlow,
    createCreateTelegramLinkCodeFlow,
    createCreateAdminPasswordResetLinkFlow,
    createEmailPasswordStrategy,
    createGetAdminAccessFlow,
    createLinkTelegramByCodeFlow,
    createPasswordResetsService,
    createRefreshTokensService,
    createRequestPasswordResetFlow,
    createRolesService,
    createSetAdminRoleFlow,
    createTelegramCodeStrategy,
    RefreshTokenAlreadyUsedError,
    RefreshTokenExpiredError,
    RefreshTokenInvalidError,
    RefreshTokenRevokedError,
    type Permission,
    RoleNameAlreadyExistsError,
    normalizeEmail
} from "@school-gate/core";
import {
    createAdminInvitesRepo,
    createAdminsRepo,
    createAdminTgCodesRepo,
    createArgon2PasswordHasher,
    createPasswordResetsRepo,
    createOutbox,
    createRefreshTokensRepo,
    createRolesRepo,
    createTokenHasher
} from "@school-gate/infra";
import { TelegramDeliveryUnavailableError } from "../errors/telegramDeliveryUnavailable.error.js";
import { CurrentPasswordInvalidError } from "../errors/currentPasswordInvalid.error.js";

function toPermissionList(permissions: string[]): Permission[] {
    return permissions as Permission[];
}

async function sendTelegramCodeMessage(input: {
    baseUrl: string;
    internalToken: string;
    timeoutMs: number;
    tgUserId: string;
    code: string;
}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.timeoutMs);
    try {
        const response = await fetch(`${input.baseUrl.replace(/\/$/, "")}/api/notification/send`, {
            method: "POST",
            headers: {
                authorization: `Bearer ${input.internalToken}`,
                "content-type": "application/json"
            },
            body: JSON.stringify({
                tgUserId: input.tgUserId,
                text: `School Gate login code: ${input.code}. It expires in 5 minutes.`
            }),
            signal: controller.signal
        });
        if (!response.ok) {
            throw new TelegramDeliveryUnavailableError();
        }
    } catch {
        throw new TelegramDeliveryUnavailableError();
    } finally {
        clearTimeout(timeout);
    }
}

export function createAuthFeature(runtime: ApiRuntime) {
    const adminsRepo = createAdminsRepo(runtime.dbClient.db);
    const rolesRepo = createRolesRepo(runtime.dbClient.db);
    const adminInvitesRepo = createAdminInvitesRepo(runtime.dbClient.db);
    const passwordResetsRepo = createPasswordResetsRepo(runtime.dbClient.db);
    const adminTgCodesRepo = createAdminTgCodesRepo(runtime.dbClient.db);
    const refreshTokensRepo = createRefreshTokensRepo(runtime.dbClient.db);
    const tokenHasher = createTokenHasher();
    const passwordHasher = createArgon2PasswordHasher();
    const outbox = createOutbox(runtime.dbClient.db);

    const adminsService = createAdminsService({ adminsRepo, outbox, idGen: runtime.idGen, passwordHasher });
    const rolesService = createRolesService({ rolesRepo, outbox, idGen: runtime.idGen, clock: runtime.clock });
    const adminInvitesService = createAdminInvitesService({ adminInvitesRepo });
    const passwordResetsService = createPasswordResetsService({ passwordResetsRepo });
    const adminTgCodesService = createAdminTgCodesService({ adminTgCodesRepo });
    const refreshTokensService = createRefreshTokensService({
        refreshTokensRepo,
        outbox,
        passwordHasher,
        idGen: runtime.idGen,
        clock: runtime.clock
    });

    const authService = createAuthService({
        strategies: [
            createEmailPasswordStrategy({ adminsService }),
            createTelegramCodeStrategy({
                adminTgCodesService,
                adminsService,
                tokenHasher,
                clock: runtime.clock
            })
        ],
        adminsService,
        rolesService,
        refreshTokensService,
        jwtSigner: createAdminJwtSigner(runtime.apiConfig.adminJwtSecret),
        clock: runtime.clock,
        accessTtlMs: runtime.apiConfig.adminJwtTtlMs,
        refreshTtlMs: runtime.apiConfig.adminRefreshTtlMs
    });

    const acceptAdminInvite = createAcceptAdminInviteFlow({
        adminsService,
        rolesService,
        adminInvitesService,
        outbox,
        passwordHasher,
        tokenHasher,
        idGen: runtime.idGen,
        clock: runtime.clock
    });
    const createAdminInvite = createCreateAdminInviteFlow({
        rolesService,
        adminInvitesService,
        outbox,
        tokenHasher,
        idGen: runtime.idGen,
        clock: runtime.clock
    });
    const createFirstAdmin = createCreateFirstAdminFlow({
        adminsService,
        rolesService,
        outbox,
        passwordHasher,
        idGen: runtime.idGen,
        clock: runtime.clock
    });
    const requestPasswordReset = createRequestPasswordResetFlow({
        adminsService,
        passwordResetsService,
        outbox,
        tokenHasher,
        idGen: runtime.idGen,
        clock: runtime.clock
    });
    const confirmPasswordReset = createConfirmPasswordResetFlow({
        adminsService,
        passwordResetsService,
        passwordHasher,
        outbox,
        tokenHasher,
        idGen: runtime.idGen,
        clock: runtime.clock
    });
    const createAdminPasswordResetLink = createCreateAdminPasswordResetLinkFlow({
        adminsService,
        passwordResetsService,
        outbox,
        tokenHasher,
        idGen: runtime.idGen,
        clock: runtime.clock
    });
    const createTelegramLinkCode = createCreateTelegramLinkCodeFlow({
        adminsService,
        adminTgCodesService,
        outbox,
        tokenHasher,
        idGen: runtime.idGen,
        clock: runtime.clock
    });
    const createTelegramLoginCode = createCreateTelegramLoginCodeFlow({
        adminsService,
        adminTgCodesService,
        outbox,
        tokenHasher,
        idGen: runtime.idGen,
        clock: runtime.clock
    });
    const linkTelegramByCode = createLinkTelegramByCodeFlow({
        adminsService,
        adminTgCodesService,
        outbox,
        tokenHasher,
        idGen: runtime.idGen,
        clock: runtime.clock
    });
    const setAdminRole = createSetAdminRoleFlow({
        adminsService,
        rolesService,
        clock: runtime.clock
    });
    const getAdminAccess = createGetAdminAccessFlow({
        adminsService,
        rolesService
    });

    const ensureRoleNameAvailable = async (name: string) => {
        const existing = await rolesService.getByName(name);
        if (existing) {
            throw new RoleNameAlreadyExistsError();
        }
    };

    const createRoleWithPermissions = async (input: { name: string; permissions: string[]; actorId?: string | undefined }) => {
        await ensureRoleNameAvailable(input.name);
        const roleId = runtime.idGen.nextId();
        await rolesService.createRole({
            id: roleId,
            name: input.name,
            permissions: toPermissionList(input.permissions),
            actorId: input.actorId
        });
        return roleId;
    };

    const module: AdminAuthModule = {
        login: async (input) => {
            const tokens = await authService.login({
                strategy: "email_password",
                payload: input
            });
            if (!tokens) {
                throw new InvalidCredentialsError();
            }

            const admin = await adminsService.getById(tokens.adminId);
            if (!admin) {
                throw new InvalidCredentialsError();
            }

            const resultDto: AdminLoginResultDto = {
                token: tokens.accessToken,
                expiresAt: tokens.accessExpiresAt.toISOString(),
                refreshToken: tokens.refreshToken,
                refreshExpiresAt: tokens.refreshExpiresAt.toISOString(),
                admin: {
                    id: admin.id,
                    email: admin.email,
                    roleId: admin.roleId,
                    status: admin.status,
                    name: admin.name,
                    tgUserId: admin.tgUserId
                }
            };
            return resultDto;
        },
        requestTelegramLoginCode: async (input) => {
            const admin = await adminsService.getByEmail(normalizeEmail(input.email));
            if (!admin) {
                throw new InvalidCredentialsError();
            }
            const ttlMs = input.expiresInMs ?? 5 * 60 * 1000;
            const result = await createTelegramLoginCode({
                adminId: admin.id,
                expiresAt: new Date(runtime.clock.now().getTime() + ttlMs)
            });
            if (!admin.tgUserId) {
                throw new InvalidCredentialsError();
            }
            await sendTelegramCodeMessage({
                baseUrl: runtime.botClientCfg.baseUrl,
                internalToken: runtime.botClientCfg.internalToken,
                timeoutMs: runtime.botClientCfg.timeoutMs,
                tgUserId: admin.tgUserId,
                code: result.code
            });
            const dto: RequestTelegramLoginCodeResultDto = {
                sent: true,
                expiresAt: result.expiresAt.toISOString()
            };
            return dto;
        },
        loginWithTelegramCode: async (input) => {
            const adminByEmail = await adminsService.getByEmail(normalizeEmail(input.email));
            if (!adminByEmail) {
                throw new InvalidCredentialsError();
            }
            const link = await adminTgCodesService.getByCodeHash(tokenHasher.hash(input.code));
            if (!link || link.adminId !== adminByEmail.id) {
                throw new InvalidCredentialsError();
            }

            const tokens = await authService.login({
                strategy: "telegram_code",
                payload: { code: input.code }
            });
            if (!tokens) {
                throw new InvalidCredentialsError();
            }

            const admin = await adminsService.getById(tokens.adminId);
            if (!admin || admin.id !== adminByEmail.id) {
                throw new InvalidCredentialsError();
            }

            const dto: TelegramOtpLoginResultDto = {
                token: tokens.accessToken,
                expiresAt: tokens.accessExpiresAt.toISOString(),
                refreshToken: tokens.refreshToken,
                refreshExpiresAt: tokens.refreshExpiresAt.toISOString(),
                admin: {
                    id: admin.id,
                    email: admin.email,
                    roleId: admin.roleId,
                    status: admin.status,
                    name: admin.name,
                    tgUserId: admin.tgUserId
                }
            };
            return dto;
        },
        refresh: async (input) => {
            const tokens = await authService.rotateRefresh({
                refreshToken: input.refreshToken
            });
            const resultDto: AdminRefreshResultDto = {
                token: tokens.accessToken,
                expiresAt: tokens.accessExpiresAt.toISOString(),
                refreshToken: tokens.refreshToken,
                refreshExpiresAt: tokens.refreshExpiresAt.toISOString()
            };
            return resultDto;
        },
        session: async (adminId) => {
            const admin = await adminsService.getById(adminId);
            if (!admin) {
                throw new InvalidCredentialsError();
            }
            const role = await rolesService.getById(admin.roleId);
            if (!role) {
                throw new InvalidCredentialsError();
            }
            const access = await getAdminAccess(admin.id);
            const dto: AdminSessionResultDto = {
                admin: {
                    id: admin.id,
                    email: admin.email,
                    roleId: admin.roleId,
                    status: admin.status,
                    name: admin.name,
                    tgUserId: admin.tgUserId
                },
                roleId: access.roleId,
                roleName: role.name,
                permissions: access.permissions
            };
            return dto;
        },
        updateMyProfile: async (input: UpdateMyProfileDto & { adminId: string }) => {
            await adminsService.setProfile({
                adminId: input.adminId,
                email: input.email,
                name: input.name ?? null,
                actorId: input.adminId,
                updatedAt: runtime.clock.now()
            });
            const admin = await adminsService.getById(input.adminId);
            if (!admin) {
                throw new InvalidCredentialsError();
            }
            const dto: UpdateMyProfileResultDto = {
                admin: {
                    id: admin.id,
                    email: admin.email,
                    roleId: admin.roleId,
                    status: admin.status,
                    name: admin.name,
                    tgUserId: admin.tgUserId
                }
            };
            return dto;
        },
        changeMyPassword: async (input: ChangeMyPasswordDto & { adminId: string }) => {
            const admin = await adminsService.getById(input.adminId);
            if (!admin) {
                throw new InvalidCredentialsError();
            }
            const loginResult = await adminsService.login({
                email: admin.email,
                password: input.currentPassword
            });
            if (!loginResult || loginResult.admin.id !== input.adminId) {
                throw new CurrentPasswordInvalidError();
            }
            const passwordHash = await passwordHasher.hash(input.newPassword);
            await adminsService.setPassword({
                adminId: input.adminId,
                passwordHash,
                actorId: input.adminId,
                updatedAt: runtime.clock.now()
            });
            const dto: ChangeMyPasswordResultDto = { adminId: input.adminId };
            return dto;
        },
        logout: async (refreshToken) => {
            try {
                await refreshTokensService.revoke({ token: refreshToken });
            } catch (error) {
                if (
                    error instanceof RefreshTokenInvalidError
                    || error instanceof RefreshTokenExpiredError
                    || error instanceof RefreshTokenRevokedError
                    || error instanceof RefreshTokenAlreadyUsedError
                ) {
                    return;
                }
                throw error;
            }
        },
        bootstrapFirstAdmin: async (input) => {
            const result = await createFirstAdmin(input as BootstrapFirstAdminDto);
            const dto: BootstrapFirstAdminResultDto = result;
            return dto;
        },
        createInvite: async (input) => {
            if ("roleName" in input) {
                const roleId = await createRoleWithPermissions({
                    name: input.roleName,
                    permissions: input.permissions ?? [],
                    actorId: input.adminId
                });
                const result = await createAdminInvite({
                    roleId,
                    email: input.email,
                    createdBy: input.adminId,
                    expiresAt: new Date(runtime.clock.now().getTime() + input.expiresInMs)
                });
                const dto: CreateAdminInviteResultDto = {
                    token: result.token,
                    roleId: result.roleId,
                    email: result.email,
                    expiresAt: result.expiresAt.toISOString()
                };
                return dto;
            }

            const result = await createAdminInvite({
                roleId: input.roleId,
                email: input.email,
                createdBy: input.adminId,
                expiresAt: new Date(runtime.clock.now().getTime() + input.expiresInMs)
            });
            const dto: CreateAdminInviteResultDto = {
                token: result.token,
                roleId: result.roleId,
                email: result.email,
                expiresAt: result.expiresAt.toISOString()
            };
            return dto;
        },
        acceptInvite: (input) => acceptAdminInvite(input),
        requestPasswordReset: async (input) => {
            const result = await requestPasswordReset({
                email: input.email,
                expiresAt: new Date(runtime.clock.now().getTime() + input.expiresInMs)
            });
            const dto: RequestPasswordResetResultDto = { token: result.token };
            return dto;
        },
        confirmPasswordReset: async (input) => {
            const result = await confirmPasswordReset(input);
            const dto: ConfirmPasswordResetResultDto = result;
            return dto;
        },
        createTelegramLinkCode: async (input) => {
            const result = await createTelegramLinkCode({
                adminId: input.adminId,
                expiresAt: new Date(runtime.clock.now().getTime() + input.expiresInMs)
            });
            const dto: CreateTelegramLinkCodeResultDto = {
                code: result.code,
                expiresAt: result.expiresAt.toISOString()
            };
            return dto;
        },
        linkTelegramByCode: async (input) => {
            const result = await linkTelegramByCode(input);
            const dto: LinkTelegramByCodeResultDto = result;
            return dto;
        },
        unlinkTelegram: async (input: { adminId: string }) => {
            await adminsService.setTgUserId({
                adminId: input.adminId,
                tgUserId: null,
                actorId: input.adminId,
                updatedAt: runtime.clock.now()
            });
            const dto: UnlinkTelegramResultDto = { adminId: input.adminId };
            return dto;
        },
        createRole: async (input, adminId) => {
            const dto: CreateRoleResultDto = { roleId: await createRoleWithPermissions({ ...input, actorId: adminId }) };
            return dto;
        },
        updateRolePermissions: async (input, adminId) => {
            await rolesService.updateRolePermissions({
                roleId: input.roleId,
                permissions: toPermissionList(input.permissions),
                actorId: adminId
            });
            return { roleId: input.roleId };
        },
        listRoles: async () => {
            const roles = await rolesService.listRoles();
            const dto: ListAdminRolesResultDto = {
                roles: roles.map((role) => ({
                    id: role.id,
                    name: role.name,
                    createdAt: role.createdAt.toISOString(),
                    updatedAt: role.updatedAt.toISOString()
                }))
            };
            return dto;
        },
        listRolePermissions: async (roleId) => {
            const permissions = await rolesService.listRolePermissions(roleId);
            const dto: ListAdminRolePermissionsResultDto = { roleId, permissions };
            return dto;
        },
        listPermissions: async () => {
            const permissions = await rolesService.listPermissions();
            const dto: ListAdminPermissionsResultDto = { permissions };
            return dto;
        }
    };

    return {
        adminsService,
        rolesService,
        createAdminPasswordResetLink,
        setAdminRole,
        getAdminAccess,
        adminAuth: createAdminAuth({
            jwtSecret: runtime.apiConfig.adminJwtSecret,
            getAdminAccess,
            cookies: {
                accessCookieName: runtime.apiConfig.authAccessCookieName,
                refreshCookieName: runtime.apiConfig.authRefreshCookieName,
                path: runtime.apiConfig.authCookiePath,
                secure: runtime.apiConfig.authCookieSecure,
                sameSite: runtime.apiConfig.authCookieSameSite
            }
        }),
        adminAuthModule: module
    };
}
