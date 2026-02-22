import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { devices as devicesTable } from "@school-gate/device/device-db/schema/index";
import { createDeleteDeviceUC } from "@school-gate/device/core/usecases/deleteDevice";
import { createGetDeviceUC } from "@school-gate/device/core/usecases/getDevice";
import { createListDevicesUC } from "@school-gate/device/core/usecases/listDevices";
import { createSetDeviceEnabledUC } from "@school-gate/device/core/usecases/setDeviceEnabled";
import { createUpdateDeviceUC } from "@school-gate/device/core/usecases/updateDevice";
import { createUpsertDeviceUC } from "@school-gate/device/core/usecases/upsertDevice";
import { createDevicesRepo } from "@school-gate/device/infra/drizzle/repos/devices.repo";
import { createDeviceTestDb } from "../helpers/deviceTestDb.js";
import { AdapterRegistry } from "../../../apps/device-service/src/api/adapterRegistry.js";
import { createAdminAuth } from "../../../apps/device-service/src/api/adminAuth.js";
import { createDeviceServiceApp } from "../../../apps/device-service/src/api/app.js";
import { signAdminJwt } from "../../../apps/api/src/delivery/http/adminJwt.js";
import type { Permission } from "@school-gate/core/auth/permissions";
import { createLogger } from "@school-gate/infra/logging/logger";

describe("DeviceService devices routes", () => {
    let cleanup: () => void;
    let db: ReturnType<typeof createDeviceTestDb>["db"];
    let app: ReturnType<typeof createDeviceServiceApp>;
    let adminToken: string;

    beforeAll(async () => {
        const tdb = createDeviceTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;

        const devicesRepo = createDevicesRepo(db);
        const clock = { now: () => new Date("2026-01-01T00:00:00.000Z") };
        const registry = new AdapterRegistry();
        const listDevices = createListDevicesUC({ devicesRepo });
        const getDevice = createGetDeviceUC({ devicesRepo });
        const upsertDevice = createUpsertDeviceUC({ devicesRepo, clock });
        const updateDevice = createUpdateDeviceUC({ devicesRepo, clock });
        const setDeviceEnabled = createSetDeviceEnabledUC({ devicesRepo, clock });
        const deleteDevice = createDeleteDeviceUC({ devicesRepo });
        const logger = createLogger({ name: "device-service-test", level: "silent" });
        const monitoring = {
            getSnapshot: () => ({
                adapters: [],
                devices: [],
                outbox: {
                    counts: { new: 0, processing: 0, processed: 0, error: 0 },
                    oldestNewCreatedAt: null
                }
            })
        };

        const jwtSecret = "test-admin-jwt-secret-32-chars-min!";
        adminToken = await signAdminJwt({
            secret: jwtSecret,
            ttlMs: 60_000,
            payload: {
                adminId: "admin-1",
                roleId: "role-1",
                permissions: ["devices.read", "devices.write"] as Permission[]
            }
        });

        app = createDeviceServiceApp({
            config: {
                token: "test-token",
                internalToken: "test-internal-token",
                heartbeatIntervalMs: 30000,
                batchLimit: 200,
                deviceTtlMs: 300000
            },
            logger,
            monitoring,
            adminAuth: createAdminAuth({ jwtSecret }),
            registry,
            listAssignments: () => ({ devices: [] }),
            recordAccessEvent: () => ({ result: "duplicate", deviceEventId: null }),
            runBackfill: async () => {},
            devices: {
                list: () => listDevices(),
                get: (id) => getDevice(id),
                upsert: (input) =>
                    upsertDevice({
                        id: input.deviceId,
                        name: input.name,
                        direction: input.direction,
                        adapterKey: input.adapterKey,
                        settingsJson: input.settingsJson ?? null,
                        enabled: input.enabled
                    }),
                update: (id, input) =>
                    updateDevice({
                        id,
                        name: input.name,
                        direction: input.direction,
                        adapterKey: input.adapterKey,
                        settingsJson: input.settingsJson,
                        enabled: input.enabled
                    }).updated,
                setEnabled: (input) => setDeviceEnabled({ id: input.deviceId, enabled: input.enabled }).updated,
                delete: (id) => deleteDevice(id).deleted
            },
            adapters: {
                list: () => registry.list()
            }
        });
    });

    afterAll(() => {
        cleanup();
    });

    beforeEach(async () => {
        await db.delete(devicesTable);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("lists devices (empty by default)", async () => {
        const res = await app.request("/api/devices", {
            headers: { authorization: `Bearer ${adminToken}` }
        });
        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toEqual({ success: true, data: { devices: [] } });
    });

    it("OPTIONS /admin/devices returns CORS headers for allowed origin", async () => {
        const res = await app.request("/api/devices", {
            method: "OPTIONS",
            headers: {
                origin: "http://localhost:3000",
                "access-control-request-method": "GET",
                "access-control-request-headers": "authorization,content-type"
            }
        });

        expect(res.status).toBe(204);
        expect(res.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
        expect(res.headers.get("vary")).toContain("Origin");
    });

    it("upserts a device and returns it in list", async () => {
        const upsertRes = await app.request("/api/devices", {
            method: "PUT",
            headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
                deviceId: "dev-1",
                name: "Main door",
                direction: "IN",
                adapterKey: "mock",
                enabled: true
            })
        });
        expect(upsertRes.status).toBe(200);
        const upsertJson = (await upsertRes.json()) as any;
        expect(upsertJson.success).toBe(true);

        const listRes = await app.request("/api/devices", {
            headers: { authorization: `Bearer ${adminToken}` }
        });
        expect(listRes.status).toBe(200);
        const json = (await listRes.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.devices).toHaveLength(1);
        expect(json.data.devices[0]).toMatchObject({
            deviceId: "dev-1",
            name: "Main door",
            direction: "IN",
            adapterKey: "mock",
            enabled: true
        });
        expect(typeof json.data.devices[0].createdAt).toBe("string");
    });

    it("gets a device by id", async () => {
        await app.request("/api/devices", {
            method: "PUT",
            headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
                deviceId: "dev-1",
                name: "Main door",
                direction: "IN",
                adapterKey: "mock",
                enabled: true
            })
        });

        const res = await app.request("/api/devices/dev-1", {
            headers: { authorization: `Bearer ${adminToken}` }
        });
        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.device).toMatchObject({
            deviceId: "dev-1",
            name: "Main door",
            direction: "IN",
            adapterKey: "mock",
            enabled: true
        });
    });

    it("updates a device via PATCH", async () => {
        await app.request("/api/devices", {
            method: "PUT",
            headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
                deviceId: "dev-1",
                name: "Main door",
                direction: "IN",
                adapterKey: "mock",
                enabled: true
            })
        });

        const patchRes = await app.request("/api/devices/dev-1", {
            method: "PATCH",
            headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({ name: "Updated name", settingsJson: "{\"zone\":\"A\"}" })
        });
        expect(patchRes.status).toBe(200);

        const getRes = await app.request("/api/devices/dev-1", {
            headers: { authorization: `Bearer ${adminToken}` }
        });
        const json = (await getRes.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.device.name).toBe("Updated name");
        expect(json.data.device.settingsJson).toBe("{\"zone\":\"A\"}");
        expect(json.data.device.direction).toBe("IN");
    });

    it("disables a device via PATCH", async () => {
        await app.request("/api/devices", {
            method: "PUT",
            headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
                deviceId: "dev-2",
                name: "Exit",
                direction: "OUT",
                adapterKey: "mock",
                enabled: true
            })
        });

        const patchRes = await app.request("/api/devices/dev-2/enabled", {
            method: "PATCH",
            headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({ enabled: false })
        });
        expect(patchRes.status).toBe(200);
        const patchJson = (await patchRes.json()) as any;
        expect(patchJson.success).toBe(true);

        const listRes = await app.request("/api/devices", {
            headers: { authorization: `Bearer ${adminToken}` }
        });
        const json = (await listRes.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.devices[0].enabled).toBe(false);
    });

    it("deletes a device", async () => {
        await app.request("/api/devices", {
            method: "PUT",
            headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
                deviceId: "dev-1",
                name: "Main door",
                direction: "IN",
                adapterKey: "mock",
                enabled: true
            })
        });

        const delRes = await app.request("/api/devices/dev-1", {
            method: "DELETE",
            headers: { authorization: `Bearer ${adminToken}` }
        });
        expect(delRes.status).toBe(200);

        const getRes = await app.request("/api/devices/dev-1", {
            headers: { authorization: `Bearer ${adminToken}` }
        });
        expect(getRes.status).toBe(404);
    });

    it("returns 404 when enabling a missing device", async () => {
        const res = await app.request("/api/devices/missing/enabled", {
            method: "PATCH",
            headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({ enabled: true })
        });
        expect(res.status).toBe(404);
        const json = (await res.json()) as any;
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("device_not_found");
    });

    it("lists adapters registered in DeviceService", async () => {
        const registerRes = await app.request("/adapters/register", {
            method: "POST",
            headers: {
                authorization: "Bearer test-token",
                "content-type": "application/json"
            },
            body: JSON.stringify({
                vendorKey: "mock",
                baseUrl: "http://localhost:1234",
                retentionMs: 3600000,
                capabilities: ["fetchEvents"],
                deviceSettingsSchema: {
                    type: "object",
                    properties: {
                        host: { type: "string", description: "Terminal host address" },
                        timeoutMs: { type: "integer" }
                    },
                    required: ["host"]
                },
                version: "1.0.0"
            })
        });
        expect(registerRes.status).toBe(200);

        const res = await app.request("/api/adapters", {
            headers: { authorization: `Bearer ${adminToken}` }
        });
        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.adapters).toHaveLength(1);
        expect(json.data.adapters[0]).toMatchObject({
            vendorKey: "mock",
            instanceKey: "mock",
            instanceName: "mock",
            baseUrl: "http://localhost:1234",
            retentionMs: 3600000,
            mode: "active",
            deviceSettingsSchema: {
                type: "object",
                properties: {
                    host: { type: "string", description: "Terminal host address" },
                    timeoutMs: { type: "integer" }
                },
                required: ["host"]
            }
        });
    });

    it("rejects invalid adapter settings schema", async () => {
        const res = await app.request("/adapters/register", {
            method: "POST",
            headers: {
                authorization: "Bearer test-token",
                "content-type": "application/json"
            },
            body: JSON.stringify({
                vendorKey: "mock-invalid",
                instanceKey: "invalid-schema",
                baseUrl: "http://localhost:1234",
                retentionMs: 3600000,
                capabilities: ["fetchEvents"],
                deviceSettingsSchema: {
                    type: "object",
                    required: [123]
                }
            })
        });

        expect(res.status).toBe(400);
        const json = (await res.json()) as any;
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("invalid_device_settings_schema");
    });

    it("accepts draft 2020-12 schema and validates settingsJson on upsert", async () => {
        const registerRes = await app.request("/adapters/register", {
            method: "POST",
            headers: {
                authorization: "Bearer test-token",
                "content-type": "application/json"
            },
            body: JSON.stringify({
                vendorKey: "mock-schema-upsert",
                instanceKey: "schema-upsert",
                baseUrl: "http://localhost:1234",
                retentionMs: 3600000,
                capabilities: ["fetchEvents"],
                deviceSettingsSchema: {
                    $schema: "https://json-schema.org/draft/2020-12/schema",
                    type: "object",
                    properties: {
                        host: { type: "string", minLength: 1 },
                        timeoutMs: { type: "integer", minimum: 100 }
                    },
                    required: ["host"],
                    additionalProperties: false
                }
            })
        });
        expect(registerRes.status).toBe(200);

        const invalidRes = await app.request("/api/devices", {
            method: "PUT",
            headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
                deviceId: "dev-schema-invalid",
                name: "Door",
                direction: "IN",
                adapterKey: "mock-schema-upsert",
                enabled: true,
                settingsJson: JSON.stringify({ timeoutMs: 200 })
            })
        });
        expect(invalidRes.status).toBe(400);
        const invalidJson = (await invalidRes.json()) as any;
        expect(invalidJson.success).toBe(false);
        expect(invalidJson.error.code).toBe("invalid_device_settings");

        const validRes = await app.request("/api/devices", {
            method: "PUT",
            headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
                deviceId: "dev-schema-valid",
                name: "Door",
                direction: "IN",
                adapterKey: "mock-schema-upsert",
                enabled: true,
                settingsJson: JSON.stringify({ host: "10.1.1.10", timeoutMs: 250 })
            })
        });
        expect(validRes.status).toBe(200);
    });

    it("validates effective adapter + settings on update when adapterKey changes", async () => {
        await app.request("/api/devices", {
            method: "PUT",
            headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
                deviceId: "dev-patch-effective",
                name: "Door",
                direction: "IN",
                adapterKey: "legacy",
                enabled: true,
                settingsJson: JSON.stringify({ some: "legacy-value" })
            })
        });

        const registerRes = await app.request("/adapters/register", {
            method: "POST",
            headers: {
                authorization: "Bearer test-token",
                "content-type": "application/json"
            },
            body: JSON.stringify({
                vendorKey: "mock-schema-update",
                instanceKey: "schema-update",
                baseUrl: "http://localhost:1234",
                retentionMs: 3600000,
                capabilities: ["fetchEvents"],
                deviceSettingsSchema: {
                    $schema: "https://json-schema.org/draft/2020-12/schema",
                    type: "object",
                    properties: {
                        host: { type: "string", minLength: 1 }
                    },
                    required: ["host"],
                    additionalProperties: false
                }
            })
        });
        expect(registerRes.status).toBe(200);

        const patchInvalidRes = await app.request("/api/devices/dev-patch-effective", {
            method: "PATCH",
            headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({ adapterKey: "mock-schema-update" })
        });
        expect(patchInvalidRes.status).toBe(400);
        const patchInvalidJson = (await patchInvalidRes.json()) as any;
        expect(patchInvalidJson.success).toBe(false);
        expect(patchInvalidJson.error.code).toBe("invalid_device_settings");

        const patchValidRes = await app.request("/api/devices/dev-patch-effective", {
            method: "PATCH",
            headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
                adapterKey: "mock-schema-update",
                settingsJson: JSON.stringify({ host: "10.1.1.20" })
            })
        });
        expect(patchValidRes.status).toBe(200);
    });

    it("rejects duplicate live adapter instance registration", async () => {
        const body = {
            vendorKey: "mock",
            instanceKey: "lab-a",
            instanceName: "Lab A",
            baseUrl: "http://localhost:1234",
            retentionMs: 3600000,
            capabilities: ["fetchEvents"]
        };

        const first = await app.request("/adapters/register", {
            method: "POST",
            headers: {
                authorization: "Bearer test-token",
                "content-type": "application/json"
            },
            body: JSON.stringify(body)
        });
        expect(first.status).toBe(200);

        const second = await app.request("/adapters/register", {
            method: "POST",
            headers: {
                authorization: "Bearer test-token",
                "content-type": "application/json"
            },
            body: JSON.stringify(body)
        });

        expect(second.status).toBe(409);
        const json = (await second.json()) as any;
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("adapter_instance_active");
    });

    it("resolves identity across devices", async () => {
        const registerRes = await app.request("/adapters/register", {
            method: "POST",
            headers: {
                authorization: "Bearer test-token",
                "content-type": "application/json"
            },
            body: JSON.stringify({
                vendorKey: "dahua",
                instanceKey: "resolver",
                baseUrl: "http://adapter.local",
                retentionMs: 3600000,
                capabilities: ["fetchEvents"],
                deviceSettingsSchema: {
                    type: "object",
                    properties: {
                        identityQueryMappings: { type: "object" }
                    }
                }
            })
        });
        expect(registerRes.status).toBe(200);

        const upsertRes = await app.request("/api/devices", {
            method: "PUT",
            headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({
                deviceId: "dev-1",
                name: "Main door",
                direction: "IN",
                adapterKey: "dahua",
                enabled: true,
                settingsJson: JSON.stringify({
                    identityQueryMappings: {
                        iin: {
                            provider: "dahua.findPerson",
                            paramsTemplate: { "person.id": "{{identityValue}}" }
                        }
                    }
                })
            })
        });
        expect(upsertRes.status).toBe(200);

        vi.stubGlobal(
            "fetch",
            vi.fn(() =>
                Promise.resolve(
                    new Response(
                        JSON.stringify({
                            success: true,
                            data: {
                                matches: [
                                    {
                                        terminalPersonId: "T-1",
                                        displayName: "Mandos",
                                        source: "accessUser",
                                        userType: "0",
                                        score: null,
                                        rawPayload: "{\"source\":\"accessUser\"}"
                                    }
                                ]
                            }
                        }),
                        { status: 200, headers: { "content-type": "application/json" } }
                    )
                )
            )
        );

        const res = await app.request("/api/identity/find", {
            method: "POST",
            headers: {
                authorization: "Bearer test-internal-token",
                "content-type": "application/json"
            },
            body: JSON.stringify({
                identityKey: "iin",
                identityValue: "900101000001"
            })
        });
        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.matches).toEqual([
            {
                deviceId: "dev-1",
                adapterKey: "dahua",
                terminalPersonId: "T-1",
                displayName: "Mandos",
                source: "accessUser",
                userType: "0",
                score: null,
                rawPayload: "{\"source\":\"accessUser\"}"
            }
        ]);
    });
});



