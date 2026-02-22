import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createDeviceTestDb } from "../helpers/deviceTestDb.js";
import { deviceEvents, deviceOutboxEvents } from "@school-gate/device/device-db/schema/index";
import { createDeviceEventsRepo } from "@school-gate/device/infra/drizzle/repos/deviceEvents.repo";
import { createDeviceOutboxRepo } from "@school-gate/device/infra/drizzle/repos/deviceOutbox.repo";
import { createDeviceUnitOfWork } from "@school-gate/device/infra/drizzle/unitOfWork";
import { createRecordDeviceAccessEventUC } from "@school-gate/device/core/usecases/recordAccessEvent";
import { DeviceDomainEvents } from "@school-gate/device/core/events/domain";

describe("recordAccessEvent", () => {
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
    });

    it("inserts device event and enqueues outbox", () => {
        const tx = createDeviceUnitOfWork(db, {
            deviceEventsRepo: createDeviceEventsRepo,
            deviceOutboxRepo: createDeviceOutboxRepo
        });

        const ids = ["evt-1", "out-1"];
        const uc = createRecordDeviceAccessEventUC({
            tx,
            idGen: { nextId: () => ids.shift() ?? "x" }
        });

        const occurredAt = new Date("2020-01-01T00:00:00.000Z");
        const res = uc({
            deviceId: "dev-1",
            eventId: "e-1",
            direction: "IN",
            occurredAt,
            terminalPersonId: "tp-1",
            rawPayload: "{\"x\":1}"
        });

        expect(res.result).toBe("inserted");

        const events = db.select().from(deviceEvents).all();
        expect(events).toHaveLength(1);
        expect(events[0]!.deviceId).toBe("dev-1");
        expect(events[0]!.eventId).toBe("e-1");

        const outbox = db.select().from(deviceOutboxEvents).all();
        expect(outbox).toHaveLength(1);
        expect(outbox[0]!.type).toBe(DeviceDomainEvents.ACCESS_EVENT_INGEST);

        const payload = JSON.parse(outbox[0]!.payloadJson);
        expect(payload.eventId).toBe("e-1");
        expect(payload.occurredAt).toBe(occurredAt.getTime());
    });

    it("does not enqueue outbox for duplicates", () => {
        const tx = createDeviceUnitOfWork(db, {
            deviceEventsRepo: createDeviceEventsRepo,
            deviceOutboxRepo: createDeviceOutboxRepo
        });

        const ids = ["evt-2", "out-2", "evt-3"];
        const uc = createRecordDeviceAccessEventUC({
            tx,
            idGen: { nextId: () => ids.shift() ?? "x" }
        });

        const occurredAt = new Date("2020-01-01T00:00:00.000Z");
        const input = {
            deviceId: "dev-2",
            eventId: "e-2",
            direction: "OUT" as const,
            occurredAt
        };

        const r1 = uc(input);
        const r2 = uc(input);

        expect(r1.result).toBe("inserted");
        expect(r2.result).toBe("duplicate");

        const events = db.select().from(deviceEvents).where(eq(deviceEvents.deviceId, "dev-2")).all();
        expect(events).toHaveLength(1);
        const outbox = db.select().from(deviceOutboxEvents).all();
        expect(outbox).toHaveLength(1);
    });
});

