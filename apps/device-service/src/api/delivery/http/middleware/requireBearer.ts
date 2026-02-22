import { createMiddleware } from "hono/factory";
import type { ApiEnv } from "../context.js";
import { unauthorizedError } from "../errors/httpError.js";

function readBearerToken(authHeader: string | undefined) {
    const [type, token] = (authHeader ?? "").split(" ");
    if (type !== "Bearer" || !token) {
        return null;
    }
    return token;
}

export function requireBearer(token: string) {
    return createMiddleware<ApiEnv>(async (c, next) => {
        const incomingToken = readBearerToken(c.req.header("authorization"));
        if (!incomingToken || incomingToken !== token) {
            throw unauthorizedError();
        }
        await next();
    });
}
