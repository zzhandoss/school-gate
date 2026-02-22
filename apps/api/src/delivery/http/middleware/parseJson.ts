import { createMiddleware } from "hono/factory";
import type { z } from "zod";
import type { ApiEnv } from "../context.js";
import { fail } from "../response.js";

export function parseBody<TSchema extends z.ZodTypeAny>(schema: TSchema) {
    return createMiddleware<ApiEnv>(async (c, next) => {
        let body: unknown;
        try {
            const rawBody = c.get("rawBody");
            if (typeof rawBody === "string") {
                body = JSON.parse(rawBody);
            } else {
                body = await c.req.json();
            }
        } catch {
            return fail(c, {
                status: 400,
                code: "invalid_json",
                message: "Request body is not valid JSON"
            });
        }

        const parsed = schema.safeParse(body);
        if (!parsed.success) {
            return fail(c, {
                status: 400,
                code: "validation_error",
                message: "Request validation failed",
                data: { issues: parsed.error.issues }
            });
        }

        c.set("body", parsed.data);
        return next();
    });
}
