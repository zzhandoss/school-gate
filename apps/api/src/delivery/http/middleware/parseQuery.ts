import { createMiddleware } from "hono/factory";
import type { z } from "zod";
import type { ApiEnv } from "../context.js";
import { fail } from "../response.js";

type QueryDefaults = Record<string, string>;

function applyQueryDefaults(raw: Record<string, string | undefined>, defaults?: QueryDefaults) {
    if (!defaults) {
        return raw;
    }

    const merged: Record<string, string | undefined> = { ...raw };
    for (const [key, value] of Object.entries(defaults)) {
        if (merged[key] === undefined) {
            merged[key] = value;
        }
    }

    return merged;
}

export function parseQuery<TSchema extends z.ZodTypeAny>(input: {
    schema: TSchema;
    defaults?: QueryDefaults;
    invalidCode: string;
    invalidMessage: string;
}) {
    return createMiddleware<ApiEnv>(async (c, next) => {
        const raw = c.req.query();
        const query = applyQueryDefaults(raw, input.defaults);
        const parsed = input.schema.safeParse(query);
        if (!parsed.success) {
            return fail(c, {
                status: 400,
                code: input.invalidCode,
                message: input.invalidMessage,
                data: { issues: parsed.error.issues }
            });
        }

        c.set("query", parsed.data);
        return next();
    });
}
