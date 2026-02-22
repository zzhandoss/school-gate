import type { Context, Handler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ApiEnv } from "../context.js";
import { ok } from "../response.js";

export type HandlerContext<TBody = unknown, TQuery = unknown, TParams = Record<string, string>> = {
    c: Context<ApiEnv>;
    body: TBody | undefined;
    query: TQuery;
    params: TParams;
};

type HandlerFn<TBody, TQuery, TParams, TResult> = (context: HandlerContext<TBody, TQuery, TParams>) => Promise<TResult> | TResult;

type HandlerOptions = {
    successStatus?: ContentfulStatusCode;
};

function readRawBodyFallback(c: Context<ApiEnv>) {
    const rawBody = c.get("rawBody");
    if (typeof rawBody !== "string") {
        return undefined;
    }

    try {
        return JSON.parse(rawBody);
    } catch {
        return rawBody;
    }
}

function resolveBody(c: Context<ApiEnv>) {
    const parsedBody = c.get("body");
    if (parsedBody !== undefined) {
        return parsedBody;
    }

    return readRawBodyFallback(c);
}

function resolveQuery(c: Context<ApiEnv>) {
    const parsedQuery = c.get("query");
    if (parsedQuery !== undefined) {
        return parsedQuery;
    }

    return c.req.query();
}

function resolveParams(c: Context<ApiEnv>) {
    const parsedParams = c.get("params");
    if (parsedParams !== undefined) {
        return parsedParams;
    }

    return c.req.param();
}

function toSerializable(value: unknown): unknown {
    if (value instanceof Date) {
        return value.toISOString();
    }

    if (Array.isArray(value)) {
        return value.map((item) => toSerializable(item));
    }

    if (value && typeof value === "object") {
        const objectValue = value as Record<string, unknown>;
        const result: Record<string, unknown> = {};
        for (const [key, item] of Object.entries(objectValue)) {
            result[key] = toSerializable(item);
        }
        return result;
    }

    return value;
}

export function handler<TBody = unknown, TQuery = unknown, TParams = Record<string, string>, TResult = unknown>(
    run: HandlerFn<TBody, TQuery, TParams, TResult>,
    options?: HandlerOptions
): Handler<ApiEnv> {
    return async (c) => {
        const result = await run({
            c,
            body: resolveBody(c) as TBody | undefined,
            query: resolveQuery(c) as TQuery,
            params: resolveParams(c) as TParams
        });
        const responseSchema = c.get("responseSchema");
        const serialized = toSerializable(result);
        const data = responseSchema ? responseSchema.parse(serialized) : serialized;
        return ok(c, data, options?.successStatus ?? 200);
    };
}
