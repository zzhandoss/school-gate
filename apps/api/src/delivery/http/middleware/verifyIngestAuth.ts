import crypto from "node:crypto";
import { createMiddleware } from "hono/factory";
import type { ApiEnv } from "../context.js";
import { fail } from "../response.js";

export type IngestAuthConfig = {
    token: string;
    hmacSecret: string;
    windowMs: number;
    now?: () => number;
};

function safeEqualHex(aHex: string, bHex: string): boolean {
    const a = Buffer.from(aHex, "hex");
    const b = Buffer.from(bHex, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

function computeSignature(secret: string, timestamp: number, rawBody: string): string {
    const payload = `${timestamp}.${rawBody}`;
    return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyIngestAuth(config: IngestAuthConfig) {
    return createMiddleware<ApiEnv>(async (c, next) => {
        const auth = c.req.header("authorization") ?? "";
        const expectedAuth = `Bearer ${config.token}`;
        if (auth !== expectedAuth) {
            return fail(c, {
                status: 401,
                code: "unauthorized",
                message: "Authorization header is invalid"
            });
        }

        const tsHeader = c.req.header("x-timestamp");
        const sigHeader = c.req.header("x-signature");
        if (!tsHeader || !sigHeader) {
            return fail(c, {
                status: 401,
                code: "unauthorized",
                message: "Missing signature headers"
            });
        }

        const timestamp = Number.parseInt(tsHeader, 10);
        if (!Number.isFinite(timestamp)) {
            return fail(c, {
                status: 401,
                code: "unauthorized",
                message: "Timestamp header is invalid"
            });
        }

        const now = config.now?.() ?? Date.now();
        if (Math.abs(now - timestamp) > config.windowMs) {
            return fail(c, {
                status: 401,
                code: "unauthorized",
                message: "Signature timestamp is outside the allowed window"
            });
        }

        const rawBody = await c.req.raw.text();
        c.set("rawBody", rawBody);

        const expectedSig = computeSignature(config.hmacSecret, timestamp, rawBody);
        if (!safeEqualHex(expectedSig, sigHeader)) {
            return fail(c, {
                status: 401,
                code: "unauthorized",
                message: "Signature verification failed"
            });
        }

        return next();
    });
}
