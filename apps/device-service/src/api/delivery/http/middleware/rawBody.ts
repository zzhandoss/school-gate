import { createMiddleware } from "hono/factory";
import type { ApiEnv } from "../context.js";

export function withRawBody() {
    return createMiddleware<ApiEnv>(async (c, next) => {
        try {
            c.set("rawBody", await c.req.text());
        } catch {
            c.set("rawBody", "");
        }
        await next();
    });
}
