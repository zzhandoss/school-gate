import type {
    ComponentHealth,
    DeviceServiceMonitoring,
    MonitoringComponentsProvider
} from "@school-gate/core";

type HttpTarget = {
    componentId: string;
    url: string;
    timeoutMs: number;
    headers?: Record<string, string>;
};

type DeviceServiceMonitoringClient = {
    getMonitoring(): Promise<DeviceServiceMonitoring | null>;
};

type DeviceServiceMonitoringDto = {
    adapters: {
        adapterId: string;
        vendorKey: string;
        baseUrl: string;
        mode: "active" | "draining";
        lastSeenAt: string;
        status: "ok" | "stale";
        ttlMs: number;
    }[];
    devices: {
        deviceId: string;
        name: string | null;
        adapterKey: string;
        lastEventAt: string | null;
        status: "ok" | "stale";
        ttlMs: number;
    }[];
    outbox: {
        counts: Record<string, number>;
        oldestNewCreatedAt: string | null;
    };
};

type ApiResponse<T> =
    | {
        success: true;
        data: T;
    }
    | {
        success: false;
        error?: unknown;
    };

function parseDate(value: string | null): Date | null {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function mapDeviceServiceDto(dto: DeviceServiceMonitoringDto): DeviceServiceMonitoring {
    return {
        adapters: dto.adapters.map((adapter) => ({
            adapterId: adapter.adapterId,
            vendorKey: adapter.vendorKey,
            baseUrl: adapter.baseUrl,
            mode: adapter.mode,
            lastSeenAt: new Date(adapter.lastSeenAt),
            status: adapter.status,
            ttlMs: adapter.ttlMs
        })),
        devices: dto.devices.map((device) => ({
            deviceId: device.deviceId,
            name: device.name ?? null,
            adapterKey: device.adapterKey,
            lastEventAt: parseDate(device.lastEventAt),
            status: device.status,
            ttlMs: device.ttlMs
        })),
        outbox: {
            counts: dto.outbox.counts as DeviceServiceMonitoring["outbox"]["counts"],
            oldestNewCreatedAt: parseDate(dto.outbox.oldestNewCreatedAt)
        }
    };
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

function unwrapResponse<T>(body: unknown): T | null {
    if (!body || typeof body !== "object") return null;
    const anyBody = body as ApiResponse<T> & { success?: unknown };
    if (typeof anyBody.success === "boolean") {
        return anyBody.success ? (anyBody.data as T) : null;
    }
    return body as T;
}

export function createDeviceServiceMonitoringHttpClient(input: {
    baseUrl: string;
    token: string;
    timeoutMs: number;
}): DeviceServiceMonitoringClient {
    const url = `${input.baseUrl.replace(/\/$/, "")}/internal/monitoring`;
    const headers = { authorization: `Bearer ${input.token}` };

    return {
        async getMonitoring() {
            try {
                const res = await fetchWithTimeout(url, { headers }, input.timeoutMs);
                if (!res.ok) return null;
                const body = await res.json();
                const dto = unwrapResponse<DeviceServiceMonitoringDto>(body);
                if (!dto) return null;
                return mapDeviceServiceDto(dto);
            } catch {
                return null;
            }
        }
    };
}

export function createMonitoringComponentsProvider(input: {
    httpTargets: HttpTarget[];
    deviceServiceClient: DeviceServiceMonitoringClient | null;
    clock: () => Date;
}): MonitoringComponentsProvider {
    return {
        async listComponents() {
            const checkedAt = input.clock();
            const results = await Promise.all(
                input.httpTargets.map(async (target) => {
                    const startedAt = Date.now();
                    try {
                        const res = await fetchWithTimeout(
                            target.url,
                            { method: "GET", headers: target.headers! },
                            target.timeoutMs
                        );
                        const responseTimeMs = Date.now() - startedAt;
                        if (!res.ok) {
                            return {
                                componentId: target.componentId,
                                status: "down",
                                checkedAt,
                                responseTimeMs,
                                error: `${res.status} ${res.statusText}`
                            } satisfies ComponentHealth;
                        }
                        return {
                            componentId: target.componentId,
                            status: "ok",
                            checkedAt,
                            responseTimeMs,
                            error: null
                        } satisfies ComponentHealth;
                    } catch (e) {
                        const message = e instanceof Error ? e.message : String(e);
                        return {
                            componentId: target.componentId,
                            status: "down",
                            checkedAt,
                            responseTimeMs: null,
                            error: message
                        } satisfies ComponentHealth;
                    }
                })
            );
            return results;
        },
        async getDeviceServiceMonitoring() {
            if (!input.deviceServiceClient) return null;
            return input.deviceServiceClient.getMonitoring();
        }
    };
}
