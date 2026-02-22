import { createMiddleware } from "hono/factory";
import type { z } from "zod";
import type { ApiEnv } from "../context.js";

export function useResponse<TSchema extends z.ZodTypeAny>(schema: TSchema) {
    return createMiddleware<ApiEnv>(async (c, next) => {
        c.set("responseSchema", schema);
        await next();
    });
}
