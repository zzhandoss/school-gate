import { createMiddleware } from "hono/factory";
import type { ApiEnv, RouteErrorMapping } from "../context.js";

export function useErrorMap(errorMap: readonly RouteErrorMapping[]) {
    return createMiddleware<ApiEnv>(async (c, next) => {
        const current = c.get("errorMap") ?? [];
        c.set("errorMap", [...current, ...errorMap]);
        await next();
    });
}

