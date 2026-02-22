import { describe, expect, it, vi } from "vitest";
import { createAdapterBackfillRunner } from "../../../apps/device-service/src/api/backfillRunner.js";
import type { AdapterSession } from "../../../apps/device-service/src/api/adapterRegistry.js";

describe("adapter backfill runner", () => {
    const baseSession: AdapterSession = {
        adapterId: "adp-1",
        vendorKey: "dahua",
        instanceKey: "instance-1",
        instanceName: "instance-1",
        baseUrl: "http://adapter",
        retentionMs: 86_400_000,
        capabilities: ["fetchEvents"],
        mode: "active",
        registeredAt: new Date("2026-01-01T00:00:00.000Z"),
        lastSeenAt: new Date("2026-01-01T00:00:00.000Z"),
    };

    it("runs backfill once and throttles within interval", async () => {
        const listAssignments = vi.fn(() => ({
            devices: [
                { deviceId: "d1", direction: "IN", settingsJson: null, lastAckedEventId: null },
                { deviceId: "d2", direction: "OUT", settingsJson: null, lastAckedEventId: "e1" },
            ],
        }));

        const backfillCalls: Array<{ deviceId: string; limit: number }> = [];
        const createBackfillForAdapter = vi.fn(() => async (input: { deviceId: string; limit: number }) => {
            backfillCalls.push(input);
            return { fetched: 1, inserted: 1, duplicates: 0, lastEventId: "x" };
        });

        const times = [
            new Date("2026-01-01T00:00:00.000Z"),
            new Date("2026-01-01T00:00:10.000Z"),
            new Date("2026-01-01T00:01:00.000Z"),
        ];
        let idx = 0;

        const runner = createAdapterBackfillRunner({
            listAssignments,
            createBackfillForAdapter,
            now: () => times[Math.min(idx, times.length - 1)]!,
            minIntervalMs: 30_000,
            limit: 500,
        });

        const first = await runner(baseSession);
        expect(first).toEqual({ status: "ok", devices: 2, fetched: 2 });
        idx++;

        const second = await runner(baseSession);
        expect(second).toEqual({ status: "skipped", reason: "throttled" });
        idx++;

        const third = await runner(baseSession);
        expect(third).toEqual({ status: "ok", devices: 2, fetched: 2 });

        expect(listAssignments).toHaveBeenCalledTimes(2);
        expect(createBackfillForAdapter).toHaveBeenCalledTimes(2);
        expect(backfillCalls).toEqual([
            { deviceId: "d1", limit: 500 },
            { deviceId: "d2", limit: 500 },
            { deviceId: "d1", limit: 500 },
            { deviceId: "d2", limit: 500 },
        ]);
    });

    it("skips when inactive or no capability", async () => {
        const runner = createAdapterBackfillRunner({
            listAssignments: () => ({ devices: [] }),
            createBackfillForAdapter: () => async () => ({ fetched: 0, inserted: 0, duplicates: 0, lastEventId: null }),
            now: () => new Date("2026-01-01T00:00:00.000Z"),
            minIntervalMs: 30_000,
            limit: 100,
        });

        const inactive = await runner({ ...baseSession, mode: "draining" });
        expect(inactive).toEqual({ status: "skipped", reason: "inactive" });

        const noCap = await runner({ ...baseSession, capabilities: [] });
        expect(noCap).toEqual({ status: "skipped", reason: "no_capability" });
    });
});


