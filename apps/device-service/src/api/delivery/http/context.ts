import type { z } from "zod";
import type { AdminContext } from "./middleware/adminAuth.js";

export type ApiEnv = {
    Variables: {
        admin?: AdminContext;
        rawBody?: string;
        body?: unknown;
        query?: unknown;
        params?: Record<string, string>;
        responseSchema?: z.ZodTypeAny;
    };
};
