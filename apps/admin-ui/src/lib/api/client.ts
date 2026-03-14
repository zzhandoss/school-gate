import { buildApiUrl, requireApiBaseUrl } from "./base-url";
import { parseEnvelope } from "./envelope";
import { ApiError } from "./types";
import type { RequestOptions } from "./types";

const API_BASE_URL = requireApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

function isAuthSessionTracePath(path: string) {
    return path === "/api/auth/session" || path === "/api/auth/refresh";
}

export async function requestApi<T>(
    path: string,
    options: RequestOptions = {}
): Promise<T> {
    const { method = "GET", body, headers = {} } = options;
    const shouldTrace = import.meta.env.DEV && isAuthSessionTracePath(path);
    const url = buildApiUrl(path, API_BASE_URL);
    const requestHeaders = new Headers(headers);
    requestHeaders.set("Content-Type", "application/json");

    if (shouldTrace) {
        const visibleCookies = typeof document !== "undefined" ? document.cookie : "";
        console.debug("[auth-trace] request", {
            path,
            url,
            method,
            credentials: "include",
            visibleCookies
        });
    }

    let response: Response;
    try {
        response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: body === undefined ? undefined : JSON.stringify(body),
            credentials: "include"
        });
    } catch {
        throw new ApiError(0, {
            code: "server_unreachable",
            message: "Cannot connect to backend server"
        });
    }

    if (shouldTrace) {
        console.debug("[auth-trace] response", {
            path,
            url,
            status: response.status,
            ok: response.ok
        });
    }

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
