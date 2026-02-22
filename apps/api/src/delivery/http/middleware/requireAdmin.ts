import { createMiddleware } from "hono/factory";
import type { ApiEnv } from "../context.js";
import { HttpError } from "../errors/httpError.js";

export function requireAdmin() {
    return createMiddleware<ApiEnv>(async (c, next) => {
        const admin = c.get("admin");
        if (!admin) {
            throw new HttpError({
                status: 401,
                code: "unauthorized",
                message: "Unauthorized"
            });
        }

        c.set("adminId", admin.adminId);
        await next();
    });
}

