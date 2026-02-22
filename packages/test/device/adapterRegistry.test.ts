import { describe, expect, it } from "vitest";
import { AdapterInstanceActiveError, AdapterRegistry } from "../../../apps/device-service/src/api/adapterRegistry.js";

describe("adapter registry identity behavior", () => {
    it("rejects second register for the same live vendor+instance identity", () => {
        let now = new Date("2026-02-10T00:00:00.000Z");
        const registry = new AdapterRegistry({
            aliveTtlMs: 30_000,
            now: () => now
        });

        registry.register({
            vendorKey: "mock",
            instanceKey: "instance-a",
            instanceName: "instance-a",
            baseUrl: "http://localhost:4020",
            retentionMs: 60_000,
            capabilities: ["fetchEvents"],
            version: "1.0.0"
        });

        now = new Date("2026-02-10T00:00:05.000Z");
        expect(() => registry.register({
            vendorKey: "mock",
            instanceKey: "instance-a",
            instanceName: "instance-a",
            baseUrl: "http://localhost:4021",
            retentionMs: 60_000,
            capabilities: ["fetchEvents"],
            version: "1.0.1"
        })).toThrow(AdapterInstanceActiveError);
    });

    it("reuses adapterId when same identity is stale", () => {
        let now = new Date("2026-02-10T00:00:00.000Z");
        const registry = new AdapterRegistry({
            aliveTtlMs: 10_000,
            now: () => now
        });

        const first = registry.register({
            vendorKey: "mock",
            instanceKey: "instance-a",
            instanceName: "instance-a",
            baseUrl: "http://localhost:4020",
            retentionMs: 60_000,
            capabilities: ["fetchEvents"],
            deviceSettingsSchema: {
                type: "object",
                properties: {
                    host: { type: "string" }
                }
            }
        });

        now = new Date("2026-02-10T00:00:20.000Z");
        const second = registry.register({
            vendorKey: "mock",
            instanceKey: "instance-a",
            instanceName: "instance-a",
            baseUrl: "http://localhost:4021",
            retentionMs: 60_000,
            capabilities: ["fetchEvents"],
            deviceSettingsSchema: {
                type: "object",
                properties: {
                    host: { type: "string" },
                    timeoutMs: { type: "integer" }
                },
                required: ["host"]
            }
        });

        expect(second.adapterId).toBe(first.adapterId);
        expect(second.baseUrl).toBe("http://localhost:4021");
        expect(second.mode).toBe("active");
        expect(second.deviceSettingsSchema).toEqual({
            type: "object",
            properties: {
                host: { type: "string" },
                timeoutMs: { type: "integer" }
            },
            required: ["host"]
        });
    });

    it("creates new active session for different instanceKey and drains previous active", () => {
        let now = new Date("2026-02-10T00:00:00.000Z");
        const registry = new AdapterRegistry({
            aliveTtlMs: 10_000,
            now: () => now
        });

        const first = registry.register({
            vendorKey: "mock",
            instanceKey: "instance-a",
            instanceName: "instance-a",
            baseUrl: "http://localhost:4020",
            retentionMs: 60_000,
            capabilities: ["fetchEvents"]
        });

        now = new Date("2026-02-10T00:00:02.000Z");
        const second = registry.register({
            vendorKey: "mock",
            instanceKey: "instance-b",
            instanceName: "instance-b",
            baseUrl: "http://localhost:4022",
            retentionMs: 60_000,
            capabilities: ["fetchEvents"]
        });

        expect(second.adapterId).not.toBe(first.adapterId);
        const all = registry.list();
        const firstSession = all.find((item) => item.adapterId === first.adapterId);
        const secondSession = all.find((item) => item.adapterId === second.adapterId);
        expect(firstSession?.mode).toBe("draining");
        expect(secondSession?.mode).toBe("active");
    });

    it("uses deterministic adapterId for same identity across fresh registries", () => {
        const firstRegistry = new AdapterRegistry();
        const secondRegistry = new AdapterRegistry();

        const input = {
            vendorKey: "mock",
            instanceKey: "instance-a",
            instanceName: "instance-a",
            baseUrl: "http://localhost:4020",
            retentionMs: 60_000,
            capabilities: ["fetchEvents"]
        };

        const first = firstRegistry.register(input);
        const second = secondRegistry.register(input);

        expect(first.adapterId).toBe(second.adapterId);
    });
});

