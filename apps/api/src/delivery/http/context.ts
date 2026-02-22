import type { Hono } from "hono";
import type { z } from "zod";
import type { AppLogger } from "@school-gate/infra";
import type { AdminContext } from "./middleware/adminAuth.js";
import type { HttpErrorInput } from "./errors/httpError.js";

export type RouteErrorMapping = {
    error: new (message?: string) => Error;
    response: HttpErrorInput | ((error: unknown) => HttpErrorInput);
};

export type ApiVariables = {
    requestId: string;
    logger: AppLogger;
    body?: unknown;
    query?: unknown;
    params?: unknown;
    rawBody?: string;
    responseSchema?: z.ZodTypeAny;
    errorMap?: readonly RouteErrorMapping[];
    admin?: AdminContext;
    adminId?: string;
};

export type ApiEnv = {
    Variables: ApiVariables;
};

export type ApiApp = Hono<ApiEnv>;
