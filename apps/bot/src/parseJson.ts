import type { Context } from "hono";
import type { ZodSchema } from "zod";
import { fail } from "./response.js";

export async function parseJson<T>(c: Context, schema: ZodSchema<T>, message: string) {
    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return { ok: false as const, response: fail(c, { status: 400, code: "invalid_json", message }) };
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return {
            ok: false as const,
            response: fail(c, {
                status: 400,
                code: "validation_error",
                message,
                data: { issues: parsed.error.issues },
            }),
        };
    }

    return { ok: true as const, data: parsed.data };
}
