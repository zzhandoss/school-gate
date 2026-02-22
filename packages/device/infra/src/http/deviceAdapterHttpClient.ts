import type { AdapterAccessEvent, DeviceAdapterClient } from "@school-gate/device/core/ports/deviceAdapterClient";

export type DeviceAdapterIdentityClient = {
    findIdentity(input: {
        deviceId: string;
        identityKey: string;
        identityValue: string;
        limit?: number;
    }): Promise<{
        terminalPersonId: string;
        firstName?: string | null;
        lastName?: string | null;
        score?: number | null;
        rawPayload?: string | null;
        displayName?: string | null;
        source?: string | null;
        userType?: string | null;
    } | null>;
};

type DeviceAdapterHttpClientConfig = {
    baseUrl: string;
    token: string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
};

type FetchEventsRequest = {
    deviceId: string;
    sinceEventId?: string | null;
    limit: number;
};

type FetchEventsResponse = {
    events: Array<{
        deviceId: string;
        eventId: string;
        direction: "IN" | "OUT";
        occurredAt: number;
        terminalPersonId?: string | null;
        rawPayload?: string | null;
    }>;
};

type EnvelopeError = {
    code?: string;
    message?: string;
};

type EnvelopeResponse<T> = {
    success: boolean;
    data?: T;
    error?: EnvelopeError;
};

type FindIdentityRequest = {
    deviceId: string;
    identityKey: string;
    identityValue: string;
    limit?: number;
};

type FindIdentityMatch = {
    terminalPersonId: string;
    firstName?: string | null;
    lastName?: string | null;
    score?: number;
    rawPayload?: string | null;
    displayName?: string | null;
    source?: string | null;
    userType?: string | null;
};

type FindIdentityResponse = {
    matches: FindIdentityMatch[];
};

function withTimeout<T>(timeoutMs: number, cb: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return cb(controller.signal).finally(() => clearTimeout(timer));
}

function unwrapEnvelope<T>(json: unknown): T {
    if (json && typeof json === "object" && "success" in json) {
        const envelope = json as EnvelopeResponse<T>;
        if (!envelope.success) {
            const code = envelope.error?.code ?? "adapter_error";
            const message = envelope.error?.message ?? "Adapter returned failure envelope";
            throw new Error(`${code}: ${message}`);
        }
        return (envelope.data ?? ({} as T)) as T;
    }
    return json as T;
}

export function createDeviceAdapterHttpClient(
    config: DeviceAdapterHttpClientConfig
): DeviceAdapterClient & DeviceAdapterIdentityClient {
    const fetchImpl = config.fetchImpl ?? fetch;
    const baseUrl = config.baseUrl.replace(/\/+$/, "");
    const timeoutMs = config.timeoutMs ?? 5_000;

    return {
        async fetchEvents(input: FetchEventsRequest): Promise<AdapterAccessEvent[]> {
            const response = await withTimeout(timeoutMs, async (signal) => {
                return fetchImpl(`${baseUrl}/events/backfill`, {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        authorization: `Bearer ${config.token}`,
                    },
                    body: JSON.stringify({
                        deviceId: input.deviceId,
                        sinceEventId: input.sinceEventId ?? null,
                        limit: input.limit,
                    }),
                    signal,
                });
            });

            if (!response.ok) {
                throw new Error(`Adapter fetchEvents failed with status ${response.status}`);
            }

            const raw = await response.json();
            const payload = unwrapEnvelope<FetchEventsResponse>(raw);
            if (!payload || !Array.isArray(payload.events)) {
                throw new Error("Adapter fetchEvents returned invalid payload");
            }

            return payload.events.map((event) => ({
                deviceId: event.deviceId,
                eventId: event.eventId,
                direction: event.direction,
                occurredAt: new Date(event.occurredAt),
                terminalPersonId: event.terminalPersonId ?? null,
                rawPayload: event.rawPayload ?? null,
            }));
        },
        async findIdentity(input: FindIdentityRequest) {
            const response = await withTimeout(timeoutMs, async (signal) => {
                return fetchImpl(`${baseUrl}/identity/find`, {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        authorization: `Bearer ${config.token}`,
                    },
                    body: JSON.stringify({
                        deviceId: input.deviceId,
                        identityKey: input.identityKey,
                        identityValue: input.identityValue,
                        limit: input.limit && input.limit > 0 ? input.limit : 1,
                    }),
                    signal,
                });
            });
            if (!response.ok) {
                throw new Error(`Adapter findIdentity failed with status ${response.status}`);
            }

            const raw = await response.json();
            const payload = unwrapEnvelope<FindIdentityResponse>(raw);
            if (!payload || !Array.isArray(payload.matches)) {
                throw new Error("Adapter findIdentity returned invalid payload");
            }

            if (payload.matches.length === 0) {
                return null;
            }

            const first = payload.matches[0];
            if (!first || typeof first.terminalPersonId !== "string" || first.terminalPersonId.length === 0) {
                throw new Error("Adapter findIdentity returned invalid terminalPersonId");
            }
            return {
                terminalPersonId: first.terminalPersonId,
                ...(first.firstName !== undefined ? { firstName: first.firstName } : {}),
                ...(first.lastName !== undefined ? { lastName: first.lastName } : {}),
                ...(first.score !== undefined ? { score: first.score } : {}),
                ...(first.rawPayload !== undefined ? { rawPayload: first.rawPayload } : {}),
                ...(first.displayName !== undefined ? { displayName: first.displayName } : {}),
                ...(first.source !== undefined ? { source: first.source } : {}),
                ...(first.userType !== undefined ? { userType: first.userType } : {}),
            };
        },
    };
}
