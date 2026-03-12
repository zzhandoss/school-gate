import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

import type { ListAuditLogsResult } from "./types";
import { buildApiUrl, resolveApiBaseUrlFromRequest } from "@/lib/api/base-url";
import { parseEnvelope } from "@/lib/api/envelope";
import { ApiError } from "@/lib/api/types";

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

type AuditLogsSearchData = {
    limit: number
    offset: number
    actorId: string
    action: string
    entityType: string
    entityId: string
    from: string
    to: string
};

async function requestBackend(path: string): Promise<ListAuditLogsResult> {
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

    return parseEnvelope<ListAuditLogsResult>(response.status, payload);
}

export const getInitialAuditLogsServerFn = createServerFn({
    method: "POST"
})
    .inputValidator((value: AuditLogsSearchData) => value)
    .handler(async ({ data }) => {
        const query = new URLSearchParams({
            limit: String(data.limit),
            offset: String(data.offset)
        });

        if (data.actorId) query.set("actorId", data.actorId);
        if (data.action) query.set("action", data.action);
        if (data.entityType) query.set("entityType", data.entityType);
        if (data.entityId) query.set("entityId", data.entityId);
        if (data.from) query.set("from", new Date(data.from).toISOString());
        if (data.to) query.set("to", new Date(data.to).toISOString());

        return requestBackend(`/api/audit-logs?${query.toString()}`);
    });
