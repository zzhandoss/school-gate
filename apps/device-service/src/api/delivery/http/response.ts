import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export type ApiError = {
    status: number;
    code: string;
    message: string;
    data?: unknown;
};

export function ok(c: Context, data: unknown, status: ContentfulStatusCode = 200) {
    return c.json({ success: true, data }, status);
}

export function fail(c: Context, err: ApiError) {
    return c.json(
        {
            success: false,
            error: {
                code: err.code,
                message: err.message,
                ...(err.data !== undefined ? { data: err.data } : {})
            }
        },
        err.status as ContentfulStatusCode
    );
}
