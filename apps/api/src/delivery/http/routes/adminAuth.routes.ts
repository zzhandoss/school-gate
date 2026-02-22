import { OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "hono";
import { z } from "zod";
import {
    acceptAdminInviteResultSchema,
    acceptAdminInviteSchema,
    adminLoginResultSchema,
    adminLoginSchema,
    adminLogoutResultSchema,
    adminRefreshResultSchema,
    adminRefreshSchema,
    adminSessionResultSchema,
    updateMyProfileResultSchema,
    updateMyProfileSchema,
    changeMyPasswordResultSchema,
    changeMyPasswordSchema,
    bootstrapFirstAdminResultSchema,
    bootstrapFirstAdminSchema,
    confirmPasswordResetResultSchema,
    confirmPasswordResetSchema,
    createAdminInviteResultSchema,
    createAdminInviteSchema,
    createRoleResultSchema,
    createRoleSchema,
    createTelegramLinkCodeResultSchema,
    createTelegramLinkCodeSchema,
    requestTelegramLoginCodeResultSchema,
    requestTelegramLoginCodeSchema,
    telegramOtpLoginResultSchema,
    telegramOtpLoginSchema,
    listAdminPermissionsResultSchema,
    listAdminRolePermissionsResultSchema,
    listAdminRolesResultSchema,
    linkTelegramByCodeResultSchema,
    linkTelegramByCodeSchema,
    unlinkTelegramResultSchema,
    unlinkTelegramSchema,
    requestPasswordResetResultSchema,
    requestPasswordResetSchema,
    updateRolePermissionsResultSchema,
    updateRolePermissionsSchema,
    type AcceptAdminInviteDto,
    type AcceptAdminInviteResultDto,
    type AdminLoginDto,
    type AdminLoginResultDto,
    type AdminLogoutResultDto,
    type AdminRefreshDto,
    type AdminRefreshResultDto,
    type AdminSessionResultDto,
    type UpdateMyProfileDto,
    type UpdateMyProfileResultDto,
    type ChangeMyPasswordDto,
    type ChangeMyPasswordResultDto,
    type BootstrapFirstAdminDto,
    type BootstrapFirstAdminResultDto,
    type ConfirmPasswordResetDto,
    type ConfirmPasswordResetResultDto,
    type CreateAdminInviteDto,
    type CreateAdminInviteResultDto,
    type CreateRoleDto,
    type CreateRoleResultDto,
    type CreateTelegramLinkCodeDto,
    type CreateTelegramLinkCodeResultDto,
    type RequestTelegramLoginCodeDto,
    type RequestTelegramLoginCodeResultDto,
    type TelegramOtpLoginDto,
    type TelegramOtpLoginResultDto,
    type ListAdminPermissionsResultDto,
    type ListAdminRolePermissionsResultDto,
    type ListAdminRolesResultDto,
    type LinkTelegramByCodeDto,
    type LinkTelegramByCodeResultDto,
    type UnlinkTelegramDto,
    type UnlinkTelegramResultDto,
    type RequestPasswordResetDto,
    type RequestPasswordResetResultDto,
    type UpdateRolePermissionsDto
} from "@school-gate/contracts";
import type { ApiEnv } from "../context.js";
import { clearAuthCookies, getAccessCookie, getRefreshCookie, setAuthCookies, type AuthCookieConfig } from "../middleware/authCookies.js";
import type { AdminAuth } from "../middleware/adminAuth.js";
import { parseBody } from "../middleware/parseJson.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { useResponse } from "../middleware/response.js";
import { handler } from "../routing/route.js";
import { defineRoute } from "../openapi/defineRoute.js";
import { HttpError } from "../errors/httpError.js";

export type AdminAuthModule = {
    login: (input: AdminLoginDto) => Promise<AdminLoginResultDto>;
    requestTelegramLoginCode: (input: RequestTelegramLoginCodeDto) => Promise<RequestTelegramLoginCodeResultDto>;
    loginWithTelegramCode: (input: TelegramOtpLoginDto) => Promise<TelegramOtpLoginResultDto>;
    refresh: (input: AdminRefreshDto) => Promise<AdminRefreshResultDto>;
    session: (adminId: string) => Promise<AdminSessionResultDto>;
    updateMyProfile: (input: UpdateMyProfileDto & { adminId: string }) => Promise<UpdateMyProfileResultDto>;
    changeMyPassword: (input: ChangeMyPasswordDto & { adminId: string }) => Promise<ChangeMyPasswordResultDto>;
    logout: (refreshToken: string) => Promise<void>;
    bootstrapFirstAdmin: (input: BootstrapFirstAdminDto) => Promise<BootstrapFirstAdminResultDto>;
    createInvite: (input: CreateAdminInviteDto & { adminId: string }) => Promise<CreateAdminInviteResultDto>;
    acceptInvite: (input: AcceptAdminInviteDto) => Promise<AcceptAdminInviteResultDto>;
    requestPasswordReset: (input: RequestPasswordResetDto) => Promise<RequestPasswordResetResultDto>;
    confirmPasswordReset: (input: ConfirmPasswordResetDto) => Promise<ConfirmPasswordResetResultDto>;
    createTelegramLinkCode: (input: CreateTelegramLinkCodeDto & { adminId: string }) => Promise<CreateTelegramLinkCodeResultDto>;
    linkTelegramByCode: (input: LinkTelegramByCodeDto) => Promise<LinkTelegramByCodeResultDto>;
    unlinkTelegram: (input: { adminId: string }) => Promise<UnlinkTelegramResultDto>;
    createRole: (input: CreateRoleDto, adminId?: string | undefined) => Promise<CreateRoleResultDto>;
    updateRolePermissions: (input: { roleId: string; permissions: string[] }, adminId?: string | undefined) => Promise<{ roleId: string }>;
    listRoles: () => Promise<ListAdminRolesResultDto>;
    listRolePermissions: (roleId: string) => Promise<ListAdminRolePermissionsResultDto>;
    listPermissions: () => Promise<ListAdminPermissionsResultDto>;
};

export function createAdminAuthRoutes(input: { module: AdminAuthModule; auth: AdminAuth; cookies: AuthCookieConfig; accessTtlMs: number; refreshTtlMs: number }) {
    const app = new OpenAPIHono<ApiEnv>();
    const roleIdParamsSchema = z.object({ roleId: z.string() });
    const authRefreshSchema = adminRefreshSchema.extend({ refreshToken: adminRefreshSchema.shape.refreshToken.optional() });
    const traceAuthCookies = process.env.NODE_ENV !== "production";
    const toMaxAgeSec = (ttlMs: number) => Math.max(1, Math.floor(ttlMs / 1000));
    const parseRefreshTokenFromBody = async (c: Context<ApiEnv>): Promise<string | null> => {
        const contentLength = c.req.header("content-length");
        const hasBody = contentLength !== undefined && contentLength !== "0";
        if (!hasBody) {
            return null;
        }

        let parsedBody: unknown;
        try {
            parsedBody = await c.req.json();
        } catch {
            throw new HttpError({
                status: 400,
                code: "invalid_json",
                message: "Request body is not valid JSON"
            });
        }

        const parsed = authRefreshSchema.safeParse(parsedBody);
        if (!parsed.success) {
            throw new HttpError({
                status: 400,
                code: "validation_error",
                message: "Request validation failed",
                data: { issues: parsed.error.issues }
            });
        }

        return parsed.data.refreshToken ?? null;
    };

    app.openapi(
        defineRoute({
            method: "post",
            path: "/login",
            tags: ["Admin Auth"],
            summary: "Admin login",
            middleware: [parseBody(adminLoginSchema), useResponse(adminLoginResultSchema)],
            request: { body: adminLoginSchema },
            success: { schema: adminLoginResultSchema }
        }),
        handler<AdminLoginDto>(async ({ c, body }) => {
            const result = await input.module.login(body as AdminLoginDto);
            setAuthCookies(c, input.cookies, {
                accessToken: result.token,
                refreshToken: result.refreshToken,
                accessMaxAgeSec: toMaxAgeSec(input.accessTtlMs),
                refreshMaxAgeSec: toMaxAgeSec(input.refreshTtlMs)
            });
            return result;
        })
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/telegram/login-code",
            tags: ["Admin Auth"],
            summary: "Request Telegram OTP login code",
            middleware: [parseBody(requestTelegramLoginCodeSchema), useResponse(requestTelegramLoginCodeResultSchema)],
            request: { body: requestTelegramLoginCodeSchema },
            success: { schema: requestTelegramLoginCodeResultSchema }
        }),
        handler<RequestTelegramLoginCodeDto>(({ body }) => input.module.requestTelegramLoginCode(body as RequestTelegramLoginCodeDto))
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/telegram/login",
            tags: ["Admin Auth"],
            summary: "Login admin by Telegram OTP code",
            middleware: [parseBody(telegramOtpLoginSchema), useResponse(telegramOtpLoginResultSchema)],
            request: { body: telegramOtpLoginSchema },
            success: { schema: telegramOtpLoginResultSchema }
        }),
        handler<TelegramOtpLoginDto>(async ({ c, body }) => {
            const result = await input.module.loginWithTelegramCode(body as TelegramOtpLoginDto);
            setAuthCookies(c, input.cookies, {
                accessToken: result.token,
                refreshToken: result.refreshToken,
                accessMaxAgeSec: toMaxAgeSec(input.accessTtlMs),
                refreshMaxAgeSec: toMaxAgeSec(input.refreshTtlMs)
            });
            return result;
        })
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/refresh",
            tags: ["Admin Auth"],
            summary: "Refresh access token",
            middleware: [useResponse(adminRefreshResultSchema)],
            request: { body: authRefreshSchema },
            success: { schema: adminRefreshResultSchema }
        }),
        handler<AdminRefreshDto>(async ({ c }) => {
            const cookieRefreshToken = getRefreshCookie(c, input.cookies);
            const requestRefreshToken = await parseRefreshTokenFromBody(c);
            const refreshToken = requestRefreshToken ?? cookieRefreshToken;
            if (traceAuthCookies) {
                const logger = c.get("logger");
                logger.info(
                    {
                        authTrace: {
                            route: "/api/auth/refresh",
                            hasCookieHeader: Boolean(c.req.header("cookie")),
                            hasRefreshCookie: Boolean(cookieRefreshToken),
                            hasBodyRefreshToken: Boolean(requestRefreshToken),
                            refreshCookieName: input.cookies.refreshCookieName
                        }
                    },
                    "admin auth cookie trace"
                );
            }
            if (!refreshToken) {
                throw new HttpError({ status: 401, code: "unauthorized", message: "Unauthorized" });
            }
            const result = await input.module.refresh({ refreshToken });
            setAuthCookies(c, input.cookies, {
                accessToken: result.token,
                refreshToken: result.refreshToken,
                accessMaxAgeSec: toMaxAgeSec(input.accessTtlMs),
                refreshMaxAgeSec: toMaxAgeSec(input.refreshTtlMs)
            });
            return result;
        })
    );

    app.openapi(
        defineRoute({
            method: "get",
            path: "/session",
            tags: ["Admin Auth"],
            summary: "Get current admin session",
            middleware: [input.auth.verify, requireAdmin(), useResponse(adminSessionResultSchema)],
            success: { schema: adminSessionResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler(async ({ c }) => {
            if (traceAuthCookies) {
                const logger = c.get("logger");
                logger.info(
                    {
                        authTrace: {
                            route: "/api/auth/session",
                            hasCookieHeader: Boolean(c.req.header("cookie")),
                            hasAccessCookie: Boolean(getAccessCookie(c, input.cookies)),
                            hasRefreshCookie: Boolean(getRefreshCookie(c, input.cookies)),
                            hasAuthorizationHeader: Boolean(c.req.header("authorization")),
                            accessCookieName: input.cookies.accessCookieName,
                            refreshCookieName: input.cookies.refreshCookieName
                        }
                    },
                    "admin auth cookie trace"
                );
            }
            return input.module.session(c.get("adminId") as string);
        })
    );

    app.openapi(
        defineRoute({
            method: "patch",
            path: "/me",
            tags: ["Admin Auth"],
            summary: "Update current admin profile",
            middleware: [input.auth.verify, requireAdmin(), parseBody(updateMyProfileSchema), useResponse(updateMyProfileResultSchema)],
            request: { body: updateMyProfileSchema },
            success: { schema: updateMyProfileResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<UpdateMyProfileDto>(({ c, body }) => {
            return input.module.updateMyProfile({
                ...(body as UpdateMyProfileDto),
                adminId: c.get("adminId") as string
            });
        })
    );

    app.openapi(
        defineRoute({
            method: "patch",
            path: "/me/password",
            tags: ["Admin Auth"],
            summary: "Change current admin password",
            middleware: [input.auth.verify, requireAdmin(), parseBody(changeMyPasswordSchema), useResponse(changeMyPasswordResultSchema)],
            request: { body: changeMyPasswordSchema },
            success: { schema: changeMyPasswordResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<ChangeMyPasswordDto>(({ c, body }) => {
            return input.module.changeMyPassword({
                ...(body as ChangeMyPasswordDto),
                adminId: c.get("adminId") as string
            });
        })
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/logout",
            tags: ["Admin Auth"],
            summary: "Logout admin and clear auth cookies",
            middleware: [useResponse(adminLogoutResultSchema)],
            success: { schema: adminLogoutResultSchema }
        }),
        handler(async ({ c }): Promise<AdminLogoutResultDto> => {
            const refreshToken = getRefreshCookie(c, input.cookies);
            try {
                if (refreshToken) {
                    await input.module.logout(refreshToken);
                }
            } finally {
                clearAuthCookies(c, input.cookies);
            }
            return { loggedOut: true };
        })
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/bootstrap/first-admin",
            tags: ["Admin Auth"],
            summary: "Create first super admin when system is empty",
            middleware: [parseBody(bootstrapFirstAdminSchema), useResponse(bootstrapFirstAdminResultSchema)],
            request: { body: bootstrapFirstAdminSchema },
            success: { schema: bootstrapFirstAdminResultSchema }
        }),
        handler<BootstrapFirstAdminDto>(({ body }) => input.module.bootstrapFirstAdmin(body as BootstrapFirstAdminDto))
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/invites",
            tags: ["Admin Auth"],
            summary: "Create admin invite",
            middleware: [
                input.auth.verify,
                requireAdmin(),
                input.auth.requirePermissions(["admin.manage"]),
                parseBody(createAdminInviteSchema),
                useResponse(createAdminInviteResultSchema)
            ],
            request: { body: createAdminInviteSchema },
            success: { schema: createAdminInviteResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<CreateAdminInviteDto>(({ c, body }) => {
            return input.module.createInvite({ ...(body as CreateAdminInviteDto), adminId: c.get("adminId") as string });
        })
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/invites/accept",
            tags: ["Admin Auth"],
            summary: "Accept admin invite",
            middleware: [parseBody(acceptAdminInviteSchema), useResponse(acceptAdminInviteResultSchema)],
            request: { body: acceptAdminInviteSchema },
            success: { schema: acceptAdminInviteResultSchema }
        }),
        handler<AcceptAdminInviteDto>(({ body }) => input.module.acceptInvite(body as AcceptAdminInviteDto))
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/password-resets/request",
            tags: ["Admin Auth"],
            summary: "Request password reset",
            middleware: [parseBody(requestPasswordResetSchema), useResponse(requestPasswordResetResultSchema)],
            request: { body: requestPasswordResetSchema },
            success: { schema: requestPasswordResetResultSchema }
        }),
        handler<RequestPasswordResetDto>(({ body }) => input.module.requestPasswordReset(body as RequestPasswordResetDto))
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/password-resets/confirm",
            tags: ["Admin Auth"],
            summary: "Confirm password reset",
            middleware: [parseBody(confirmPasswordResetSchema), useResponse(confirmPasswordResetResultSchema)],
            request: { body: confirmPasswordResetSchema },
            success: { schema: confirmPasswordResetResultSchema }
        }),
        handler<ConfirmPasswordResetDto>(({ body }) => input.module.confirmPasswordReset(body as ConfirmPasswordResetDto))
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/telegram/link-code",
            tags: ["Admin Auth"],
            summary: "Create Telegram link code",
            middleware: [
                input.auth.verify,
                requireAdmin(),
                parseBody(createTelegramLinkCodeSchema),
                useResponse(createTelegramLinkCodeResultSchema)
            ],
            request: { body: createTelegramLinkCodeSchema },
            success: { schema: createTelegramLinkCodeResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<CreateTelegramLinkCodeDto>(({ c, body }) => {
            return input.module.createTelegramLinkCode({ ...(body as CreateTelegramLinkCodeDto), adminId: c.get("adminId") as string });
        })
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/telegram/link-by-code",
            tags: ["Admin Auth"],
            summary: "Link Telegram by code",
            middleware: [parseBody(linkTelegramByCodeSchema), useResponse(linkTelegramByCodeResultSchema)],
            request: { body: linkTelegramByCodeSchema },
            success: { schema: linkTelegramByCodeResultSchema }
        }),
        handler<LinkTelegramByCodeDto>(({ body }) => input.module.linkTelegramByCode(body as LinkTelegramByCodeDto))
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/telegram/unlink",
            tags: ["Admin Auth"],
            summary: "Unlink Telegram from current admin",
            middleware: [
                input.auth.verify,
                requireAdmin(),
                parseBody(unlinkTelegramSchema),
                useResponse(unlinkTelegramResultSchema)
            ],
            request: { body: unlinkTelegramSchema },
            success: { schema: unlinkTelegramResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<UnlinkTelegramDto>(({ c }) => {
            return input.module.unlinkTelegram({
                adminId: c.get("adminId") as string
            });
        })
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/roles",
            tags: ["Admin Auth"],
            summary: "Create role",
            middleware: [
                input.auth.verify,
                input.auth.requirePermissions(["admin.manage"]),
                parseBody(createRoleSchema),
                useResponse(createRoleResultSchema)
            ],
            request: { body: createRoleSchema },
            success: { schema: createRoleResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<CreateRoleDto>(({ c, body }) =>
            input.module.createRole(body as CreateRoleDto, c.get("admin")?.adminId)
        )
    );

    app.openapi(
        defineRoute({
            method: "patch",
            path: "/roles/:roleId",
            tags: ["Admin Auth"],
            summary: "Update role permissions",
            middleware: [
                input.auth.verify,
                input.auth.requirePermissions(["admin.manage"]),
                parseBody(updateRolePermissionsSchema),
                useResponse(updateRolePermissionsResultSchema)
            ],
            request: {
                params: roleIdParamsSchema,
                body: updateRolePermissionsSchema
            },
            success: { schema: updateRolePermissionsResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<UpdateRolePermissionsDto, unknown, { roleId: string }>(({ c, body, params }) => {
            return input.module.updateRolePermissions(
                { roleId: params.roleId, permissions: (body as UpdateRolePermissionsDto).permissions },
                c.get("admin")?.adminId
            );
        })
    );

    app.openapi(
        defineRoute({
            method: "get",
            path: "/roles",
            tags: ["Admin Auth"],
            summary: "List roles",
            middleware: [
                input.auth.verify,
                input.auth.requirePermissions(["admin.manage"]),
                useResponse(listAdminRolesResultSchema)
            ],
            success: { schema: listAdminRolesResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler(() => input.module.listRoles())
    );

    app.openapi(
        defineRoute({
            method: "get",
            path: "/roles/:roleId/permissions",
            tags: ["Admin Auth"],
            summary: "List role permissions",
            middleware: [
                input.auth.verify,
                input.auth.requirePermissions(["admin.manage"]),
                useResponse(listAdminRolePermissionsResultSchema)
            ],
            request: { params: roleIdParamsSchema },
            success: { schema: listAdminRolePermissionsResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<unknown, unknown, { roleId: string }>(({ params }) => input.module.listRolePermissions(params.roleId))
    );

    app.openapi(
        defineRoute({
            method: "get",
            path: "/permissions",
            tags: ["Admin Auth"],
            summary: "List permissions",
            middleware: [
                input.auth.verify,
                input.auth.requirePermissions(["admin.manage"]),
                useResponse(listAdminPermissionsResultSchema)
            ],
            success: { schema: listAdminPermissionsResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler(() => input.module.listPermissions())
    );

    return app;
}
