import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ApiEnv } from "./context.js";

export function ok<T>(c: Context<ApiEnv>, data: T, status: ContentfulStatusCode = 200) {
    return c.json({ success: true as const, data }, status);
}

export function fail(
    c: Context<ApiEnv>,
    input: { status: ContentfulStatusCode; code: string; message: string; data?: unknown }
) {
    const { status, code, message, data } = input;
    return c.json(
        {
            success: false as const,
            error: { code, message, data }
        },
        status
    );
}
