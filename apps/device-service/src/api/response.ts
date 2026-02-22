import type { Context } from "hono";
export { ok, fail, type ApiError } from "./delivery/http/response.js";

export function unauthorized(c: Context) {
    return c.json(
        {
            success: false,
            error: {
                code: "unauthorized",
                message: "Unauthorized"
            }
        },
        401
    );
}
