import { createMiddleware } from "hono/factory";
import type { z } from "zod";
import type { ApiEnv } from "../context.js";
import { HttpError } from "../errors/httpError.js";

export function parseBody<TSchema extends z.ZodTypeAny>(schema: TSchema) {
    return createMiddleware<ApiEnv>(async (c, next) => {
        const rawBody = c.get("rawBody");
        let body: unknown;

        try {
            body = typeof rawBody === "string" ? JSON.parse(rawBody) : await c.req.json();
        } catch {
            throw new HttpError({
                status: 400,
                code: "invalid_json",
                message: "Request body is not valid JSON"
            });
        }

        const parsed = schema.safeParse(body);
        if (!parsed.success) {
            throw new HttpError({
                status: 400,
                code: "validation_error",
                message: "Request validation failed",
                data: { issues: parsed.error.issues }
            });
        }

        c.set("body", parsed.data);
        await next();
    });
}
