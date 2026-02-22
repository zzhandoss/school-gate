import crypto from "node:crypto";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import type { ApiEnv } from "../context.js";
import type { AppLogger } from "@school-gate/infra";
import { createRequestLogger } from "@school-gate/infra";

function getPath(url: string): string {
    try {
        return new URL(url).pathname;
    } catch {
        return url;
    }
}

const REDACTED = "[redacted]";
const MAX_BODY_CHARS = 4096;

function shouldRedactKey(key: string) {
    const normalized = key.toLowerCase();
    return normalized.includes("password")
        || normalized.includes("token")
        // TEMP for auth debugging: keep authorization/cookie visible in logs.
        // || normalized.includes("authorization")
        // || normalized.includes("cookie")
        || normalized.includes("signature")
        || normalized.includes("secret");
}

function truncateString(value: string, maxChars: number) {
    if (value.length <= maxChars) {
        return value;
    }
    return `${value.slice(0, maxChars)}...[truncated:${value.length - maxChars}]`;
}

function safeParseJson(raw: string) {
    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
}

function sanitizeValue(value: unknown, keyHint?: string): unknown {
    if (keyHint && shouldRedactKey(keyHint)) {
        return REDACTED;
    }

    if (value === null || value === undefined) {
        return value;
    }

    if (typeof value === "string") {
        return truncateString(value, MAX_BODY_CHARS);
    }

    if (Array.isArray(value)) {
        return value.map((item) => sanitizeValue(item));
    }

    if (typeof value === "object") {
        const output: Record<string, unknown> = {};
        for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
            output[key] = sanitizeValue(item, key);
        }
        return output;
    }

    return value;
}

function collectQuery(url: URL) {
    const query: Record<string, string | string[]> = {};
    for (const [key, value] of url.searchParams.entries()) {
        const current = query[key];
        if (current === undefined) {
            query[key] = value;
            continue;
        }
        if (Array.isArray(current)) {
            current.push(value);
            continue;
        }
        query[key] = [current, value];
    }
    return query;
}

async function collectRequestBody(c: Context<ApiEnv>) {
    const method = c.req.method.toUpperCase();
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
        return undefined;
    }

    const rawBodyFromContext = c.get("rawBody");
    if (typeof rawBodyFromContext === "string" && rawBodyFromContext.length > 0) {
        return sanitizeValue(safeParseJson(rawBodyFromContext));
    }

    const contentType = c.req.header("content-type") ?? "";
    if (!contentType.includes("application/json") && !contentType.includes("application/x-www-form-urlencoded")) {
        return undefined;
    }

    try {
        const raw = await c.req.raw.clone().text();
        if (raw.length === 0) {
            return undefined;
        }
        return sanitizeValue(safeParseJson(raw));
    } catch {
        return undefined;
    }
}

async function collectRequestMeta(c: Context<ApiEnv>) {
    const url = new URL(c.req.url);
    const query = collectQuery(url);
    const body = await collectRequestBody(c);
    const headers = sanitizeValue({
        origin: c.req.header("origin"),
        contentType: c.req.header("content-type"),
        userAgent: c.req.header("user-agent"),
        authorization: c.req.header("authorization"),
        cookie: c.req.header("cookie")
    });
    return {
        method: c.req.method,
        path: url.pathname,
        query,
        headers,
        body
    };
}

function toErrorLog(err: unknown) {
    if (err instanceof Error) {
        return {
            name: err.name,
            message: err.message
        };
    }
    return { message: String(err) };
}

export function requestContext(baseLogger: AppLogger) {
    return createMiddleware<ApiEnv>(async (c, next) => {
        const requestId = crypto.randomUUID();
        const path = getPath(c.req.url);
        const request = await collectRequestMeta(c);
        const logger = createRequestLogger(baseLogger, {
            requestId,
            method: c.req.method,
            path
        });

        c.set("requestId", requestId);
        c.set("logger", logger);

        const startedAt = Date.now();
        let thrownError: unknown | null = null;
        try {
            await next();
        } catch (err) {
            thrownError = err;
            throw err;
        } finally {
            const durationMs = Date.now() - startedAt;
            const status = c.res.status;
            const payload = {
                request,
                response: {
                    status,
                    durationMs
                }
            };

            if (thrownError) {
                logger.error({ ...payload, error: toErrorLog(thrownError) }, "request failed");
                return;
            }

            if (status >= 500) {
                logger.error(payload, "request finished with server error");
                return;
            }
            if (status >= 400) {
                logger.warn(payload, "request finished with client error");
                return;
            }
            logger.info(payload, "request finished");
        }
    });
}
