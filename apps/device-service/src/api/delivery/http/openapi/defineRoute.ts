import { createRoute, extendZodWithOpenApi, z } from "@hono/zod-openapi";
import * as zod from "zod";
import type { MiddlewareHandler } from "hono";
import { apiFailureSchema, apiSuccessSchema } from "@school-gate/contracts";
import type { ApiEnv } from "../context.js";

extendZodWithOpenApi(z);
extendZodWithOpenApi(zod as any);

const defaultErrorStatuses = [400, 401, 403, 404, 409, 500] as const;

type ZodMaybeOpenApi = z.ZodTypeAny & {
    openapi?: (...args: any[]) => unknown;
};

type DocumentedRouteInput = {
    method: "get" | "post" | "patch" | "put" | "delete";
    path: string;
    tags: string[];
    summary?: string;
    middleware?: MiddlewareHandler<ApiEnv>[];
    request?: {
        body?: z.ZodTypeAny;
        query?: z.ZodTypeAny;
        params?: z.ZodTypeAny;
        headers?: z.ZodTypeAny;
    };
    success: {
        schema: z.ZodTypeAny;
        status?: number;
        description?: string;
    };
    errors?: number[];
    security?: Array<Record<string, string[]>>;
};

function toOpenApiPath(path: string) {
    return path.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

function ensureOpenApiMethod<TSchema extends z.ZodTypeAny>(schema: TSchema): TSchema {
    const candidate = schema as ZodMaybeOpenApi & { _def?: { openapi?: Record<string, unknown> } };
    if (typeof candidate.openapi === "function") {
        return schema;
    }

    (candidate as any).openapi = function openapi(...args: any[]) {
        const metadata = typeof args[0] === "string" ? args[1] : args[0];
        if (metadata && candidate._def) {
            const current = candidate._def.openapi ?? {};
            candidate._def.openapi = { ...current, ...metadata };
        }
        return this;
    };

    return schema;
}

function ensureOpenApiDeep<TSchema extends z.ZodTypeAny>(schema: TSchema): TSchema {
    const root = ensureOpenApiMethod(schema);
    const candidate = root as unknown as {
        _def?: { shape?: Record<string, z.ZodTypeAny> | (() => Record<string, z.ZodTypeAny>) };
    };

    const rawShape = candidate._def?.shape;
    const shape = typeof rawShape === "function" ? rawShape() : rawShape;
    if (shape && typeof shape === "object") {
        for (const value of Object.values(shape)) {
            ensureOpenApiMethod(value);
        }
    }

    return root;
}

function toOpenApiRequest(input: DocumentedRouteInput["request"]) {
    if (!input) {
        return undefined;
    }

    const request: Record<string, unknown> = {};

    if (input.body) {
        request.body = {
            content: {
                "application/json": {
                    schema: ensureOpenApiDeep(input.body),
                },
            },
        };
    }

    if (input.query) {
        request.query = ensureOpenApiDeep(input.query);
    }

    if (input.params) {
        request.params = ensureOpenApiDeep(input.params);
    }

    if (input.headers) {
        request.headers = ensureOpenApiDeep(input.headers);
    }

    return Object.keys(request).length > 0 ? request : undefined;
}

function toOpenApiResponses(input: DocumentedRouteInput) {
    const status = input.success.status ?? 200;
    const responses: Record<string, unknown> = {
        [String(status)]: {
            description: input.success.description ?? "Successful response",
            content: {
                "application/json": {
                    schema: ensureOpenApiMethod(apiSuccessSchema(ensureOpenApiMethod(input.success.schema))),
                },
            },
        },
    };

    const errors = input.errors ?? [...defaultErrorStatuses];
    for (const errorStatus of errors) {
        responses[String(errorStatus)] = {
            description: "Error response",
            content: {
                "application/json": {
                    schema: ensureOpenApiMethod(apiFailureSchema),
                },
            },
        };
    }

    return responses;
}

export function defineRoute(input: DocumentedRouteInput) {
    const request = toOpenApiRequest(input.request);

    return createRoute({
        method: input.method,
        path: toOpenApiPath(input.path),
        tags: input.tags,
        responses: toOpenApiResponses(input) as any,
        ...(input.summary ? { summary: input.summary } : {}),
        ...(input.middleware ? { middleware: input.middleware } : {}),
        ...(request ? { request } : {}),
        ...(input.security ? { security: input.security } : {}),
    });
}
