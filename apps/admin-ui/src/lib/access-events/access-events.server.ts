import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

import type { ListAccessEventsResult } from "./types";
import { buildApiUrl, resolveApiBaseUrlFromRequest } from "@/lib/api/base-url";
import { parseEnvelope } from "@/lib/api/envelope";
import { ApiError } from "@/lib/api/types";

const API_BASE_URL = process.env.VITE_API_BASE_URL;

function getRequestApiBaseUrl() {
    return resolveApiBaseUrlFromRequest({
        apiBaseUrl: API_BASE_URL ?? "",
        origin: getRequestHeader("origin"),
        forwardedHost: getRequestHeader("x-forwarded-host"),
        forwardedProto: getRequestHeader("x-forwarded-proto"),
        host: getRequestHeader("host")
    });
}

async function requestBackend<T>(path: string): Promise<T> {
    const headers = new Headers({
        "Content-Type": "application/json"
    });
    const cookieHeader = getRequestHeader("cookie") ?? "";
    if (cookieHeader) {
        headers.set("cookie", cookieHeader);
    }

    let response: Response;
    try {
        response = await fetch(buildApiUrl(path, getRequestApiBaseUrl()), {
            method: "GET",
            headers
        });
    } catch {
        throw new ApiError(0, {
            code: "server_unreachable",
            message: "Cannot connect to backend server"
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

export const getInitialAccessEventsServerFn = createServerFn({
    method: "POST"
})
    .inputValidator((value: {
        limit: number
        offset: number
        status: "all" | "NEW" | "PROCESSING" | "PROCESSED" | "FAILED_RETRY" | "UNMATCHED" | "ERROR"
        direction: "all" | "IN" | "OUT"
        deviceId: string
        iin: string
        terminalPersonId: string
        from: string
        to: string
    }) => value)
    .handler(async ({ data }): Promise<ListAccessEventsResult> => {

        const query = new URLSearchParams({
            limit: String(data.limit),
            offset: String(data.offset)
        });

        if (data.status !== "all") query.set("status", data.status);
        if (data.direction !== "all") query.set("direction", data.direction);
        if (data.deviceId) query.set("deviceId", data.deviceId);
        if (data.iin) query.set("iin", data.iin);
        if (data.terminalPersonId) query.set("terminalPersonId", data.terminalPersonId);
        if (data.from) query.set("from", new Date(data.from).toISOString());
        if (data.to) query.set("to", new Date(data.to).toISOString());

        return requestBackend<ListAccessEventsResult>(`/api/access-events?${query.toString()}`);
    });
