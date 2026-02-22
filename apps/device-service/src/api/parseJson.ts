import type { Context } from "hono";
import type { ZodTypeAny } from "zod";
import { fail } from "./response.js";

export type ParsedBody<T> =
    | { ok: true; data: T }
    | { ok: false; response: Response };

export async function parseJson<T>(
    c: Context,
    schema: ZodTypeAny,
    message: string
): Promise<ParsedBody<T>> {
    let body: unknown = null;
    try {
        body = await c.req.json();
    } catch {
        body = null;
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return {
            ok: false,
            response: fail(c, { status: 400, code: "validation_error", message }),
        };
    }

    return { ok: true, data: parsed.data as T };
}
