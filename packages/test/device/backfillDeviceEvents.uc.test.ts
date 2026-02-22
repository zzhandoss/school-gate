import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { createDeviceTestDb } from "../helpers/deviceTestDb.js";
import { deviceCursors, deviceEvents, deviceOutboxEvents } from "@school-gate/device/device-db/schema/index";
import { createDeviceCursorsRepo } from "@school-gate/device/infra/drizzle/repos/deviceCursors.repo";
import { createDeviceEventsRepo } from "@school-gate/device/infra/drizzle/repos/deviceEvents.repo";
import { createDeviceOutboxRepo } from "@school-gate/device/infra/drizzle/repos/deviceOutbox.repo";
import { createDeviceUnitOfWork } from "@school-gate/device/infra/drizzle/unitOfWork";
import { createRecordDeviceAccessEventUC } from "@school-gate/device/core/usecases/recordAccessEvent";
import { createBackfillDeviceEventsUC } from "@school-gate/device/core/usecases/backfillDeviceEvents";
import type { DeviceAdapterClient } from "@school-gate/device/core/ports/deviceAdapterClient";

describe("backfillDeviceEvents", () => {
    let db: ReturnType<typeof createDeviceTestDb>["db"];
    let cleanup: () => void;

    beforeAll(() => {
        const tdb = createDeviceTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;
    });

    afterAll(() => cleanup());

    beforeEach(() => {
        db.delete(deviceOutboxEvents).run();
        db.delete(deviceEvents).run();
        db.delete(deviceCursors).run();
    });

    it("fetches since cursor and enqueues only new events", async () => {
        const cursorsRepo = createDeviceCursorsRepo(db);
        const cursorTime = new Date("2026-01-01T00:00:00.000Z");
        cursorsRepo.upsertIfNewer({
            deviceId: "d1",
            eventId: "e1",
            occurredAt: cursorTime,
            updatedAt: cursorTime
        });

        db.insert(deviceEvents).values({
            id: "dup-1",
            deviceId: "d1",
            eventId: "e2",
            direction: "IN",
            occurredAt: new Date("2026-01-01T00:01:00.000Z"),
            terminalPersonId: null,
            rawPayload: null
        }).run();

        const fetchEvents = vi.fn(async (input) => {
            expect(input.deviceId).toBe("d1");
            expect(input.sinceEventId).toBe("e1");
            expect(input.limit).toBe(10);
            return [
                {
                    deviceId: "d1",
                    eventId: "e2",
                    direction: "IN" as const,
                    occurredAt: new Date("2026-01-01T00:01:00.000Z"),
                    terminalPersonId: null,
                    rawPayload: null
                },
                {
                    deviceId: "d1",
                    eventId: "e3",
                    direction: "OUT" as const,
                    occurredAt: new Date("2026-01-01T00:02:00.000Z"),
                    terminalPersonId: "tp-1",
                    rawPayload: "{\"x\":1}"
                }
            ];
        });

        const adapterClient: DeviceAdapterClient = { fetchEvents };

        let seq = 0;
        const idGen = { nextId: () => `id-${++seq}` };
        const tx = createDeviceUnitOfWork(db, {
            deviceEventsRepo: createDeviceEventsRepo,
            deviceOutboxRepo: createDeviceOutboxRepo
        });
        const recordAccessEvent = createRecordDeviceAccessEventUC({ tx, idGen });

        const backfill = createBackfillDeviceEventsUC({
            adapterClient,
            deviceCursorsRepo: cursorsRepo,
            recordAccessEvent
        });

        const res = await backfill({ deviceId: "d1", limit: 10 });

        expect(res.fetched).toBe(2);
        expect(res.inserted).toBe(1);
        expect(res.duplicates).toBe(1);
        expect(res.lastEventId).toBe("e3");
        expect(fetchEvents).toHaveBeenCalledTimes(1);

        const outbox = db.select().from(deviceOutboxEvents).all();
        expect(outbox).toHaveLength(1);

        const stored = db
            .select()
            .from(deviceEvents)
            .where(eq(deviceEvents.eventId, "e3"))
            .get();
        expect(stored).not.toBeUndefined();
    });
});

