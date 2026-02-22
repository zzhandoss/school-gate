import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createLogger } from "@school-gate/infra/logging/logger";
import type { RuntimeSettingsSnapshotDto } from "@school-gate/contracts";
import { createApiApp } from "../../../apps/api/src/app.js";
import { createDeviceServiceGatewayFeatureFromConfig } from "../../../apps/api/src/composition/features/deviceServiceGateway.feature.js";
import {
    createAllowAllAdminAuth,
    createStubAdminAuthHandlers,
    createStubAdminsHandlers,
    createStubAlertsHandlers,
    createStubAuditLogsHandlers,
    createStubSubscriptionsHandlers
} from "../helpers/adminAuth.js";

function numberField(key: string, value: number) {
    return { key, env: value, effective: value };
}

function stringField(key: string, value: string) {
    return { key, env: value, effective: value };
}

function booleanField(key: string, value: boolean) {
    return { key, env: value, effective: value };
}

function createRuntimeSettingsSnapshot(): RuntimeSettingsSnapshotDto {
    return {
        worker: {
            pollMs: numberField("worker.pollMs", 1000),
            batch: numberField("worker.batch", 100),
            autoResolvePersonByIin: booleanField("worker.autoResolvePersonByIin", false)
        },
        outbox: {
            pollMs: numberField("outbox.pollMs", 1000),
            batch: numberField("outbox.batch", 100),
            maxAttempts: numberField("outbox.maxAttempts", 10),
            leaseMs: numberField("outbox.leaseMs", 5000),
            processingBy: stringField("outbox.processingBy", "default")
        },
        accessEvents: {
            pollMs: numberField("accessEvents.pollMs", 1000),
            batch: numberField("accessEvents.batch", 100),
            retryDelayMs: numberField("accessEvents.retryDelayMs", 1000),
            leaseMs: numberField("accessEvents.leaseMs", 5000),
            maxAttempts: numberField("accessEvents.maxAttempts", 10),
            processingBy: stringField("accessEvents.processingBy", "default")
        },
        retention: {
            pollMs: numberField("retention.pollMs", 1000),
            batch: numberField("retention.batch", 500),
            accessEventsDays: numberField("retention.accessEventsDays", 30),
            auditLogsDays: numberField("retention.auditLogsDays", 30)
        },
        monitoring: {
            workerTtlMs: numberField("monitoring.workerTtlMs", 120000)
        },
        notifications: {
            parentTemplate: stringField("notifications.parentTemplate", "template"),
            parentMaxAgeMs: numberField("notifications.parentMaxAgeMs", 600000),
            alertMaxAgeMs: numberField("notifications.alertMaxAgeMs", 300000)
        }
    };
}

describe("API device-service gateway routes", () => {
    let app: ReturnType<typeof createApiApp>;
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeAll(() => {
        const logger = createLogger({ name: "api-test", level: "silent" });
        app = createApiApp({
            logger,
            adminAuth: createAllowAllAdminAuth(),
            adminAuthModule: createStubAdminAuthHandlers(),
            admins: createStubAdminsHandlers(),
            runtimeSettings: {
                list: () => createRuntimeSettingsSnapshot(),
                set: () => ({ updated: 0 })
            },
            accessEvents: {
                verifyIngestAuth: async (_c, next) => next(),
                module: {
                    ingest: async () => ({
                        result: "duplicate",
                        status: "NEW",
                        personId: null,
                        accessEventId: null
                    })
                }
            },
            accessEventsAdmin: {
                listUnmatched: async () => [],
                mapTerminalIdentity: async () => ({ status: "already_linked", updatedEvents: 0 })
            },
            persons: {
                searchByIin: async () => []
            },
            subscriptionRequests: {
                listPending: async () => ({ requests: [], page: { limit: 50, offset: 0, total: 0 } }),
                review: async () => ({ requestId: "r1", status: "rejected", personId: null })
            },
            subscriptions: createStubSubscriptionsHandlers(),
            retention: {
                applySchedule: async () => ({
                    taskName: "school-gate-retention",
                    platform: process.platform,
                    pollMs: 300000,
                    intervalMinutes: 5
                }),
                removeSchedule: async () => ({
                    taskName: "school-gate-retention",
                    platform: process.platform,
                    removed: true
                }),
                runOnce: async () => ({
                    accessEventsDeleted: 0,
                    auditLogsDeleted: 0,
                    accessEventsCutoff: "2026-01-01T00:00:00.000Z",
                    auditLogsCutoff: "2026-01-01T00:00:00.000Z",
                    batch: 500,
                    accessEventsDays: 30,
                    auditLogsDays: 30
                })
            },
            monitoring: {
                getSnapshot: async () => ({
                    now: "2026-01-01T00:00:00.000Z",
                    accessEvents: {
                        counts: { NEW: 0, PROCESSING: 0, PROCESSED: 0, FAILED_RETRY: 0, UNMATCHED: 0, ERROR: 0 },
                        oldestUnprocessedOccurredAt: null
                    },
                    outbox: {
                        counts: { new: 0, processing: 0, processed: 0, error: 0 },
                        oldestNewCreatedAt: null
                    },
                    workers: [],
                    topErrors: { accessEvents: [], outbox: [] },
                    components: [],
                    deviceService: null
                }),
                listSnapshots: async () => ({ snapshots: [] })
            },
            deviceServiceGateway: createDeviceServiceGatewayFeatureFromConfig({
                baseUrl: "http://localhost:4010",
                internalToken: "internal-token",
                timeoutMs: 3000,
                adminJwtSecret: "test-secret-that-is-definitely-32-characters-long",
                adminJwtTtlMs: 60000
            }),
            alerts: createStubAlertsHandlers(),
            auditLogs: createStubAuditLogsHandlers()
        });
    });

    beforeEach(() => {
        fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("GET /api/ds/devices forwards bearer token and returns device list", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    success: true,
                    data: {
                        devices: [
                            {
                                deviceId: "dev-1",
                                name: "Turnstile A",
                                direction: "IN",
                                adapterKey: "mock",
                                enabled: true,
                                settingsJson: null,
                                createdAt: "2026-01-01T00:00:00.000Z",
                                updatedAt: "2026-01-01T00:00:00.000Z"
                            }
                        ]
                    }
                }),
                { status: 200, headers: { "content-type": "application/json" } }
            )
        );

        const response = await app.request("/api/ds/devices", {
            headers: { authorization: "Bearer forwarded-token" }
        });
        expect(response.status).toBe(200);

        const json = (await response.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.devices).toHaveLength(1);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe("http://localhost:4010/api/devices");
        expect(init.method).toBe("GET");
        expect((init.headers as Record<string, string>).authorization).toBe("Bearer forwarded-token");
    });

    it("GET /api/ds/monitoring uses internal token upstream", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    success: true,
                    data: {
                        adapters: [],
                        devices: [],
                        outbox: {
                            counts: { new: 0, processing: 0, processed: 0, error: 0 },
                            oldestNewCreatedAt: null
                        }
                    }
                }),
                { status: 200, headers: { "content-type": "application/json" } }
            )
        );

        const response = await app.request("/api/ds/monitoring");
        expect(response.status).toBe(200);

        const json = (await response.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.adapters).toEqual([]);

        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect((init.headers as Record<string, string>).authorization).toBe("Bearer internal-token");
    });

    it("POST /api/ds/identity/find uses internal token and forwards payload", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    success: true,
                    data: {
                        identityKey: "iin",
                        identityValue: "900101000001",
                        matches: [
                            {
                                deviceId: "dev-1",
                                adapterKey: "dahua",
                                terminalPersonId: "T-1"
                            }
                        ],
                        diagnostics: {
                            adaptersScanned: 1,
                            devicesScanned: 2,
                            devicesEligible: 1,
                            requestsSent: 1,
                            errors: 0
                        },
                        errors: []
                    }
                }),
                { status: 200, headers: { "content-type": "application/json" } }
            )
        );

        const response = await app.request("/api/ds/identity/find", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ identityKey: "iin", identityValue: "900101000001" })
        });
        expect(response.status).toBe(200);

        const json = (await response.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.matches).toHaveLength(1);

        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe("http://localhost:4010/api/identity/find");
        expect((init.headers as Record<string, string>).authorization).toBe("Bearer internal-token");
        expect(JSON.parse(String(init.body))).toEqual({
            identityKey: "iin",
            identityValue: "900101000001",
            limit: 1
        });
    });

    it("PATCH /api/ds/devices/:deviceId maps upstream error envelope", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    success: false,
                    error: {
                        code: "device_not_found",
                        message: "Device not found"
                    }
                }),
                { status: 404, headers: { "content-type": "application/json" } }
            )
        );

        const response = await app.request("/api/ds/devices/dev-404", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name: "Updated" })
        });
        expect(response.status).toBe(404);

        const json = (await response.json()) as any;
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("device_not_found");
        expect(json.error.message).toBe("Device not found");
    });

    it("GET /api/ds/adapters maps upstream unavailability", async () => {
        fetchMock.mockRejectedValueOnce(new Error("connect ECONNREFUSED"));

        const response = await app.request("/api/ds/adapters");
        expect(response.status).toBe(502);

        const json = (await response.json()) as any;
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("device_service_unavailable");
    });

    it("GET /api/ds/adapters forwards adapter settings schema", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    success: true,
                    data: {
                        adapters: [
                            {
                                adapterId: "mock-1",
                                vendorKey: "mock",
                                instanceKey: "instance-a",
                                instanceName: "Instance A",
                                baseUrl: "http://localhost:4020",
                                retentionMs: 3600000,
                                capabilities: ["fetchEvents"],
                                deviceSettingsSchema: {
                                    type: "object",
                                    properties: {
                                        host: { type: "string" }
                                    },
                                    required: ["host"]
                                },
                                mode: "active",
                                registeredAt: "2026-01-01T00:00:00.000Z",
                                lastSeenAt: "2026-01-01T00:00:00.000Z"
                            }
                        ]
                    }
                }),
                { status: 200, headers: { "content-type": "application/json" } }
            )
        );

        const response = await app.request("/api/ds/adapters");
        expect(response.status).toBe(200);
        const json = (await response.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.adapters[0].deviceSettingsSchema).toEqual({
            type: "object",
            properties: {
                host: { type: "string" }
            },
            required: ["host"]
        });
    });

    it("GET /api/ds/devices maps malformed upstream success payload", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    success: true,
                    data: { items: [] }
                }),
                { status: 200, headers: { "content-type": "application/json" } }
            )
        );

        const response = await app.request("/api/ds/devices");
        expect(response.status).toBe(502);

        const json = (await response.json()) as any;
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("device_service_invalid_response");
    });
});


