import { jwtVerify } from "jose";
import { createMiddleware } from "hono/factory";
import type { ApiEnv } from "../context.js";
import { forbiddenError, unauthorizedError } from "../errors/httpError.js";

export type AdminContext = {
    adminId: string;
    permissions: string[];
};

export function adminAuth(input: { jwtSecret: string }) {
    const secret = new TextEncoder().encode(input.jwtSecret);

    const verify = createMiddleware<ApiEnv>(async (c, next) => {
        const auth = c.req.header("authorization") ?? "";
        const [type, token] = auth.split(" ");
        if (type !== "Bearer" || !token) {
            throw unauthorizedError();
        }

        let payload: unknown;
        try {
            ({ payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] }));
        } catch {
            throw unauthorizedError();
        }

        const candidate = payload as { sub?: unknown; permissions?: unknown };
        if (typeof candidate.sub !== "string" || candidate.sub.length === 0 || !Array.isArray(candidate.permissions)) {
            throw unauthorizedError();
        }

        c.set("admin", {
            adminId: candidate.sub,
            permissions: candidate.permissions.map(String)
        });

        await next();
    });

    const requirePermissions = (permissions: string[]) => {
        return createMiddleware<ApiEnv>(async (c, next) => {
            const admin = c.get("admin");
            if (!admin) {
                throw unauthorizedError();
            }

            for (const permission of permissions) {
                if (!admin.permissions.includes(permission)) {
                    throw forbiddenError();
                }
            }

            await next();
        });
    };

    return { verify, requirePermissions };
}

export type AdminAuth = ReturnType<typeof adminAuth>;
