import type { AdapterAccessEvent } from "./types.js";

export type AdapterAssignments = {
    adapterId: string;
    mode: "active" | "draining";
    heartbeatIntervalMs: number;
    batchLimit: number;
    devices: Array<{
        deviceId: string;
        direction: "IN" | "OUT";
        lastAckedEventId?: string | null;
    }>;
};

type DeviceServiceClientConfig = {
    baseUrl: string;
    token: string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
};

type RegisterInput = {
    vendorKey: string;
    instanceKey?: string;
    instanceName?: string;
    baseUrl: string;
    retentionMs: number;
    version?: string;
    capabilities: string[];
};

type PushResult = {
    eventId: string;
    result: "inserted" | "duplicate" | "error";
    deviceEventId?: string;
};

type PushResponse = {
    results: PushResult[];
};

function withTimeout<T>(timeoutMs: number, cb: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return cb(controller.signal).finally(() => clearTimeout(timer));
}

async function parseJson(response: Response) {
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text);
}

function unwrapEnvelope<T>(payload: any): T {
    if (!payload) {
        throw new Error("Empty response from DeviceService");
    }
    if (payload.success === false) {
        throw new Error(payload.error?.message ?? "DeviceService error");
    }
    if (payload.success === true) {
        return payload.data as T;
    }
    return payload as T;
}

function assertAssignments(payload: any): AdapterAssignments {
    if (!payload || typeof payload.adapterId !== "string" || !payload.adapterId) {
        throw new Error("Invalid adapter assignments payload");
    }
    if (payload.mode !== "active" && payload.mode !== "draining") {
        throw new Error("Invalid adapter mode");
    }
    if (typeof payload.heartbeatIntervalMs !== "number" || payload.heartbeatIntervalMs <= 0) {
        throw new Error("Invalid heartbeat interval");
    }
    if (typeof payload.batchLimit !== "number" || payload.batchLimit <= 0) {
        throw new Error("Invalid batch limit");
    }
    if (!Array.isArray(payload.devices)) {
        throw new Error("Invalid devices list");
    }

    return payload as AdapterAssignments;
}

export function createDeviceServiceClient(config: DeviceServiceClientConfig) {
    const fetchImpl = config.fetchImpl ?? fetch;
    const baseUrl = config.baseUrl.replace(/\/+$/, "");
    const timeoutMs = config.timeoutMs ?? 5_000;

    async function postJson<T>(path: string, body: unknown): Promise<T> {
        const response = await withTimeout(timeoutMs, async (signal) => {
            return fetchImpl(`${baseUrl}${path}`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    authorization: `Bearer ${config.token}`
                },
                body: JSON.stringify(body),
                signal
            });
        });

        const json = await parseJson(response);
        if (!response.ok) {
            const message = json?.error?.message ?? `DeviceService error ${response.status}`;
            throw new Error(String(message));
        }

        return unwrapEnvelope<T>(json);
    }

    return {
        async register(input: RegisterInput): Promise<AdapterAssignments> {
            const payload = await postJson<AdapterAssignments>("/adapters/register", input);
            return assertAssignments(payload);
        },
        async heartbeat(adapterId: string): Promise<AdapterAssignments> {
            const payload = await postJson<AdapterAssignments>("/adapters/heartbeat", { adapterId });
            return assertAssignments(payload);
        },
        async pushEvents(adapterId: string, events: AdapterAccessEvent[]): Promise<PushResponse> {
            return postJson<PushResponse>("/adapters/events", {
                adapterId,
                events: events.map((event) => ({
                    deviceId: event.deviceId,
                    eventId: event.eventId,
                    direction: event.direction,
                    occurredAt: event.occurredAt,
                    terminalPersonId: event.terminalPersonId ?? null,
                    rawPayload: event.rawPayload ?? null
                }))
            });
        }
    };
}
