type DeviceServicePersonResolverConfig = {
    baseUrl: string;
    token: string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
};

type IdentityFindMatch = {
    deviceId: string;
    terminalPersonId: string;
    displayName?: string | null;
    source?: string | null;
    userType?: string | null;
    score?: number | null;
    rawPayload?: string | null;
};

type IdentityFindSuccess = {
    identityKey: string;
    identityValue: string;
    matches: IdentityFindMatch[];
};

type ApiEnvelope<T> =
    | { success: true; data: T }
    | { success: false; error?: { message?: string } };

function withTimeout<T>(timeoutMs: number, cb: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return cb(controller.signal).finally(() => clearTimeout(timer));
}

function isEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
    if (!value || typeof value !== "object") {
        return false;
    }
    return typeof (value as { success?: unknown }).success === "boolean";
}

export function createDeviceServicePersonResolver(config: DeviceServicePersonResolverConfig) {
    const fetchImpl = config.fetchImpl ?? fetch;
    const baseUrl = config.baseUrl.replace(/\/+$/, "");
    const timeoutMs = config.timeoutMs ?? 5_000;

    return {
        async resolveByIin(input: { iin: string }) {
            try {
                const response = await withTimeout(timeoutMs, async (signal) => {
                    return fetchImpl(`${baseUrl}/api/identity/find`, {
                        method: "POST",
                        headers: {
                            "content-type": "application/json",
                            authorization: `Bearer ${config.token}`,
                        },
                        body: JSON.stringify({
                            identityKey: "iin",
                            identityValue: input.iin,
                            limit: 1,
                        }),
                        signal,
                    });
                });
                const json = (await response.json()) as unknown;
                if (!response.ok) {
                    const envelope = isEnvelope<IdentityFindSuccess>(json) ? json : null;
                    const errorMessage = envelope && !envelope.success && typeof envelope.error?.message === "string"
                        ? envelope.error.message
                        : `Device-service person lookup failed with status ${response.status}`;
                    return { kind: "error" as const, message: errorMessage };
                }

                const data = isEnvelope<IdentityFindSuccess>(json)
                    ? json.success
                        ? json.data
                        : null
                    : (json as IdentityFindSuccess);

                if (!data) {
                    return {
                        kind: "error" as const,
                        message: "Device-service person lookup returned invalid payload",
                    };
                }

                if (!data || !Array.isArray(data.matches)) {
                    return {
                        kind: "error" as const,
                        message: "Device-service person lookup returned invalid payload",
                    };
                }

                if (data.matches.length === 0) {
                    return { kind: "not_found" as const };
                }

                return {
                    kind: "found" as const,
                    mappings: data.matches.map((match: IdentityFindMatch) => ({
                        deviceId: match.deviceId,
                        terminalPersonId: match.terminalPersonId,
                    })),
                };
            } catch (error) {
                return {
                    kind: "error" as const,
                    message: error instanceof Error ? error.message : String(error),
                };
            }
        },
    };
}
