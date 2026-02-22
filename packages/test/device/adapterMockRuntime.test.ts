import { describe, expect, it, vi } from "vitest";
import { createAdapterRuntime } from "../../../apps/adapters/mock/src/runtime.js";
import { createPeopleCatalog, type TerminalPerson } from "../../../apps/adapters/mock/src/peopleCatalog.js";

describe("adapter mock runtime generation", () => {
    it("generates 3 events per device in one cycle when random=0.5", async () => {
        vi.useFakeTimers();

        const inserted: Array<{ deviceId: string; terminalPersonId: string | null | undefined }> = [];
        const eventsRepo = {
            insert(event: { deviceId: string; terminalPersonId?: string | null }) {
                inserted.push({ deviceId: event.deviceId, terminalPersonId: event.terminalPersonId });
                return { id: inserted.length, eventId: String(inserted.length) };
            },
            listUnsentForDevices() {
                return [];
            },
            markSent() {
                return { updated: 0 };
            },
            deleteOlderThan() {
                return { deleted: 0 };
            }
        };

        const peopleCatalog = createPeopleCatalog([
            { code: "a", terminalPersonId: "TP-A", fullName: "A" },
            { code: "b", terminalPersonId: "TP-B", fullName: "B" },
            { code: "c", terminalPersonId: "TP-C", fullName: "C" }
        ]);

        const runtime = createAdapterRuntime({
            config: {
                vendorKey: "mock",
                instanceKey: "mock",
                instanceName: "mock",
                baseUrl: "http://localhost:4020",
                retentionMs: 60_000,
                retentionSweepMs: 60_000,
                eventIntervalMs: 10,
                pushIntervalMs: 10_000,
                batchLimit: 100
            },
            eventsRepo: eventsRepo as any,
            deviceServiceClient: {
                register: async () => ({
                    adapterId: "adapter-1",
                    instanceKey: "mock",
                    instanceName: "mock",
                    mode: "active" as const,
                    heartbeatIntervalMs: 10_000,
                    batchLimit: 100,
                    devices: [
                        { deviceId: "dev-1", direction: "IN" as const },
                        { deviceId: "dev-2", direction: "OUT" as const }
                    ]
                }),
                heartbeat: async () => {
                    throw new Error("not expected");
                },
                pushEvents: async () => ({ results: [] })
            } as any,
            peopleCatalog,
            random: () => 0.5,
            sleep: async () => undefined
        });

        runtime.start();
        await vi.advanceTimersByTimeAsync(11);
        runtime.stop();

        const dev1 = inserted.filter((item) => item.deviceId === "dev-1");
        const dev2 = inserted.filter((item) => item.deviceId === "dev-2");

        expect(dev1).toHaveLength(3);
        expect(dev2).toHaveLength(3);
        vi.useRealTimers();
    });
});

describe("people catalog", () => {
    it("resolves random profile terminalPersonId dynamically", () => {
        const people: TerminalPerson[] = [
            { code: "fixed", terminalPersonId: "TP-FIXED", fullName: "Fixed Person" },
            { code: "random", terminalPersonId: null, fullName: "Random Person", random: true }
        ];
        const catalog = createPeopleCatalog(people);
        const randomProfile = people[1]!;

        const first = catalog.resolveTerminalPersonId(randomProfile);
        const second = catalog.resolveTerminalPersonId(randomProfile);

        expect(first).toMatch(/^TP-\d{6}$/);
        expect(second).toMatch(/^TP-\d{6}$/);
        expect(first).not.toBe(second);
    });
});
