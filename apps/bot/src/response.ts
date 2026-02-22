import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export function ok<T>(c: Context, data: T) {
    return c.json({ success: true, data }, 200);
}

export function fail(
    c: Context,
    input: {
        status: number;
        code: string;
        message: string;
        data?: Record<string, unknown>;
    }
) {
    return c.json({ success: false, error: { code: input.code, message: input.message, data: input.data } }, input.status as ContentfulStatusCode);
}

export function unauthorized(c: Context) {
    return fail(c, { status: 401, code: "unauthorized", message: "Unauthorized" });
}
