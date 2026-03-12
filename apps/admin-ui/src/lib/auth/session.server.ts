import { createServerFn } from "@tanstack/react-start";
import {
    getRequestHeader,
    setResponseHeaders
} from "@tanstack/react-start/server";

import { mapSessionPayload } from "./session-mapper";
import type { AuthSessionPayload } from "./session-mapper";
import type { SessionState } from "./types";
import { buildApiUrl, resolveApiBaseUrlFromRequest } from "@/lib/api/base-url";
import { parseEnvelope } from "@/lib/api/envelope";
import { ApiError } from "@/lib/api/types";

type ResolveSessionResult = {
    session: SessionState | null
    unavailable: boolean
};

const API_BASE_URL =
    process.env.VITE_API_BASE_URL ??
    process.env.API_BASE_URL ??
    null;

function getRequestApiBaseUrl() {
    return resolveApiBaseUrlFromRequest({
        apiBaseUrl: API_BASE_URL,
        origin: getRequestHeader("origin"),
        forwardedHost: getRequestHeader("x-forwarded-host"),
        forwardedProto: getRequestHeader("x-forwarded-proto"),
        host: getRequestHeader("host")
    });
}

function forwardSetCookieHeaders(response: Response) {
    const headers = response.headers as Headers & {
        getSetCookie?: () => Array<string>
    };
    const setCookies =
        typeof headers.getSetCookie === "function"
            ? headers.getSetCookie()
            : (() => {
                const single = response.headers.get("set-cookie");
                return single ? [single] : [];
            })();

    if (setCookies.length === 0) {
        return;
    }

    const out = new Headers();
    for (const value of setCookies) {
        out.append("set-cookie", value);
    }
    setResponseHeaders(out);
}

async function requestBackend<T>(
    path: string,
    options: {
        method: "GET" | "POST"
        body?: unknown
    }
): Promise<T> {
    const cookieHeader = getRequestHeader("cookie") ?? "";
    const headers = new Headers({
        "Content-Type": "application/json"
    });

    if (cookieHeader) {
        headers.set("cookie", cookieHeader);
    }

    let response: Response;
    try {
        response = await fetch(buildApiUrl(path, getRequestApiBaseUrl()), {
            method: options.method,
            headers,
            body: options.body === undefined ? undefined : JSON.stringify(options.body)
        });
    } catch {
        throw new ApiError(0, {
            code: "server_unreachable",
            message: "Cannot connect to backend server"
        });
    }

    forwardSetCookieHeaders(response);

    let payload: unknown = null;
    try {
        payload = await response.json();
    } catch {
        throw new ApiError(response.status, {
            code: "invalid_json",
            message: "API returned invalid JSON"
        });
    }

    return parseEnvelope<T>(response.status, payload);
}

async function fetchSessionFromBackend() {
    const payload = await requestBackend<AuthSessionPayload>("/api/auth/session", {
        method: "GET"
    });
    return mapSessionPayload(payload) satisfies SessionState;
}

async function refreshSessionOnBackend() {
    await requestBackend("/api/auth/refresh", {
        method: "POST",
        body: {}
    });
}

export const resolveSessionServerFn = createServerFn({
    method: "GET"
}).handler(async (): Promise<ResolveSessionResult> => {
    try {
        const session = await fetchSessionFromBackend();
        return { session, unavailable: false };
    } catch (error) {
        if (!(error instanceof ApiError)) {
            throw error;
        }

        if (error.code === "server_unreachable") {
            return { session: null, unavailable: true };
        }

        if (error.status !== 401) {
            throw error;
        }
    }

    try {
        await refreshSessionOnBackend();
        const session = await fetchSessionFromBackend();
        return { session, unavailable: false };
    } catch (error) {
        if (error instanceof ApiError && error.code === "server_unreachable") {
            return { session: null, unavailable: true };
        }
        if (error instanceof ApiError && error.status === 401) {
            return { session: null, unavailable: false };
        }
        throw error;
    }
});
