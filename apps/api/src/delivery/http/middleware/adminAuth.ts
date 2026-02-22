import { jwtVerify } from "jose";
import type { MiddlewareHandler } from "hono";
import type { Permission, AdminAccess } from "@school-gate/core";
import { AdminDisabledError, AdminNotFoundError } from "@school-gate/core";
import type { ApiEnv } from "../context.js";
import { getAccessCookie, type AuthCookieConfig } from "./authCookies.js";
import { fail } from "../response.js";

export type AdminContext = {
    adminId: string;
    roleId: string;
    permissions: Permission[];
};

export type AdminAuth = {
    verify: MiddlewareHandler<ApiEnv>;
    requirePermissions: (permissions: Permission[]) => MiddlewareHandler<ApiEnv>;
};

export function createAdminAuth(input: {
    jwtSecret: string;
    getAdminAccess: (adminId: string) => Promise<AdminAccess>;
    cookies: AuthCookieConfig;
}): AdminAuth {
    const secret = new TextEncoder().encode(input.jwtSecret);

    const resolveBearerToken = (authorizationHeader: string | undefined) => {
        if (!authorizationHeader) {
            return null;
        }
        const [type, token] = authorizationHeader.split(" ");
        if (type !== "Bearer" || !token) {
            return null;
        }
        return token;
    };

    const toFailure = (error: unknown) => {
        if (error instanceof AdminDisabledError) {
            return { status: 403, code: "admin_disabled", message: "Admin is disabled" } as const;
        }
        if (error instanceof AdminNotFoundError) {
            return { status: 401, code: "unauthorized", message: "Unauthorized" } as const;
        }
        return { status: 401, code: "unauthorized", message: "Unauthorized" } as const;
    };
    const unauthorizedFailure = { status: 401, code: "unauthorized", message: "Unauthorized" } as const;

    const tryResolveAdmin = async (token: string) => {
        try {
            const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
            const adminId = payload.sub;
            if (typeof adminId !== "string" || adminId.length === 0) {
                return { ok: false as const, failure: unauthorizedFailure, fromAccessCheck: false as const };
            }
            const access = await input.getAdminAccess(adminId);
            return {
                ok: true as const,
                admin: {
                    adminId: access.adminId,
                    roleId: access.roleId,
                    permissions: access.permissions
                }
            };
        } catch (error) {
            if (error instanceof AdminDisabledError || error instanceof AdminNotFoundError) {
                return { ok: false as const, failure: toFailure(error), fromAccessCheck: true as const };
            }
            return {
                ok: false as const,
                failure: unauthorizedFailure,
                fromAccessCheck: false as const
            };
        }
    };

    const verify: MiddlewareHandler<ApiEnv> = async (c, next) => {
        const bearerToken = resolveBearerToken(c.req.header("authorization"));
        const cookieToken = getAccessCookie(c, input.cookies);

        if (!bearerToken && !cookieToken) {
            return fail(c, { status: 401, code: "unauthorized", message: "Unauthorized" });
        }

        if (bearerToken) {
            const bearer = await tryResolveAdmin(bearerToken);
            if (bearer.ok) {
                c.set("admin", bearer.admin);
                return next();
            }
            if (bearer.fromAccessCheck) {
                return fail(c, bearer.failure);
            }
        }

        if (!cookieToken) {
            return fail(c, { status: 401, code: "unauthorized", message: "Unauthorized" });
        }

        const cookie = await tryResolveAdmin(cookieToken);
        if (cookie.ok) {
            c.set("admin", cookie.admin);
            return next();
        }
        return fail(c, cookie.failure);
    };

    const requirePermissions = (permissions: Permission[]): MiddlewareHandler<ApiEnv> => {
        return async (c, next) => {
            const admin = c.get("admin");
            if (!admin) {
                return fail(c, { status: 401, code: "unauthorized", message: "Unauthorized" });
            }

            for (const permission of permissions) {
                if (!admin.permissions.includes(permission)) {
                    return fail(c, { status: 403, code: "forbidden", message: "Forbidden" });
                }
            }

            return next();
        };
    };

    return { verify, requirePermissions };
}
