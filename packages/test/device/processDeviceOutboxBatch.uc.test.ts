import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { createDeviceTestDb } from "../helpers/deviceTestDb.js";
import { deviceCursors, deviceOutboxEvents } from "@school-gate/device/device-db/schema/index";
import { createDeviceCursorsRepo } from "@school-gate/device/infra/drizzle/repos/deviceCursors.repo";
import { createDeviceOutboxRepo } from "@school-gate/device/infra/drizzle/repos/deviceOutbox.repo";
import { createProcessDeviceOutboxBatchUC } from "@school-gate/device/core/usecases/processDeviceOutboxBatch";
import { DeviceDomainEvents } from "@school-gate/device/core/events/domain";
import type { CoreIngestClient } from "@school-gate/device/core/ports/coreIngestClient";

class NonRetriableError extends Error {
    readonly retriable = false;
}

describe("processDeviceOutboxBatch", () => {
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
        db.delete(deviceCursors).run();
    });

    it("claims and processes access_event.ingest", async () => {
        db.insert(deviceOutboxEvents).values({
            id: "o1",
            type: DeviceDomainEvents.ACCESS_EVENT_INGEST,
            payloadJson: JSON.stringify({
                eventId: "e1",
                deviceId: "d1",
                direction: "IN",
                occurredAt: 1_700_000_000_000,
            }),
            status: "new",
            attempts: 0,
        }).run();

        const sendEvent = vi.fn(async () => ({
            result: "inserted" as const,
            status: "NEW" as const,
            personId: null,
            accessEventId: "ae1",
        }));

        const coreIngestClient: CoreIngestClient = {
            sendEvent,
            sendBatch: async () => ({ results: [] }),
        };

        const uc = createProcessDeviceOutboxBatchUC({
            deviceOutboxRepo: createDeviceOutboxRepo(db),
            coreIngestClient,
            deviceCursorsRepo: createDeviceCursorsRepo(db),
        });

        const res = await uc({
            limit: 10,
            maxAttempts: 5,
            leaseMs: 60_000,
            processingBy: "tester",
            now: () => new Date("2020-01-02T00:00:00.000Z"),
        });

        expect(res.claimed).toBe(1);
        expect(res.processed).toBe(1);
        expect(sendEvent).toHaveBeenCalledTimes(1);

        const rows = db.select().from(deviceOutboxEvents).where(eq(deviceOutboxEvents.id, "o1")).all();
        expect(rows[0]!.status).toBe("processed");
        expect(rows[0]!.processedAt).not.toBeNull();

        const cursor = db.select().from(deviceCursors).where(eq(deviceCursors.deviceId, "d1")).get();
        expect(cursor?.lastAckedEventId).toBe("e1");
        expect(cursor?.lastAckedAt).not.toBeNull();
    });

    it("moves unknown event type to error when maxAttempts is 1", async () => {
        db.insert(deviceOutboxEvents).values({
            id: "o-unknown",
            type: "unknown",
            payloadJson: "{}",
            status: "new",
            attempts: 0,
        }).run();

        const coreIngestClient: CoreIngestClient = {
            sendEvent: async () => {
                throw new Error("should not be called");
            },
            sendBatch: async () => ({ results: [] }),
        };

        const uc = createProcessDeviceOutboxBatchUC({
            deviceOutboxRepo: createDeviceOutboxRepo(db),
            coreIngestClient,
            deviceCursorsRepo: createDeviceCursorsRepo(db),
        });

        await uc({
            limit: 10,
            maxAttempts: 1,
            leaseMs: 60_000,
            processingBy: "tester",
            now: () => new Date(),
        });

        const rows = db.select().from(deviceOutboxEvents).where(eq(deviceOutboxEvents.id, "o-unknown")).all();
        expect(rows[0]!.status).toBe("error");
    });

    it("treats non-retriable ingest errors as terminal", async () => {
        db.insert(deviceOutboxEvents).values({
            id: "o-non-retriable",
            type: DeviceDomainEvents.ACCESS_EVENT_INGEST,
            payloadJson: JSON.stringify({
                eventId: "e2",
                deviceId: "d2",
                direction: "OUT",
                occurredAt: 1_700_000_000_100,
            }),
            status: "new",
            attempts: 0,
        }).run();

        const coreIngestClient: CoreIngestClient = {
            sendEvent: async () => {
                throw new NonRetriableError("bad request");
            },
            sendBatch: async () => ({ results: [] }),
        };

        const uc = createProcessDeviceOutboxBatchUC({
            deviceOutboxRepo: createDeviceOutboxRepo(db),
            coreIngestClient,
            deviceCursorsRepo: createDeviceCursorsRepo(db),
        });

        await uc({
            limit: 10,
            maxAttempts: 10,
            leaseMs: 60_000,
            processingBy: "tester",
            now: () => new Date(),
        });

        const rows = db.select().from(deviceOutboxEvents).where(eq(deviceOutboxEvents.id, "o-non-retriable")).all();
        expect(rows[0]!.status).toBe("error");
    });

    it("treats 4xx http errors as terminal", async () => {
        db.insert(deviceOutboxEvents).values({
            id: "o-http-err",
            type: DeviceDomainEvents.ACCESS_EVENT_INGEST,
            payloadJson: JSON.stringify({
                eventId: "e3",
                deviceId: "d3",
                direction: "IN",
                occurredAt: 1_700_000_000_200,
            }),
            status: "new",
            attempts: 0,
        }).run();

        const coreIngestClient: CoreIngestClient = {
            sendEvent: async () => {
                const err = new Error("forbidden") as Error & { status?: number };
                err.status = 403;
                throw err;
            },
            sendBatch: async () => ({ results: [] }),
        };

        const uc = createProcessDeviceOutboxBatchUC({
            deviceOutboxRepo: createDeviceOutboxRepo(db),
            coreIngestClient,
            deviceCursorsRepo: createDeviceCursorsRepo(db),
        });

        await uc({
            limit: 10,
            maxAttempts: 10,
            leaseMs: 60_000,
            processingBy: "tester",
            now: () => new Date(),
        });

        const rows = db.select().from(deviceOutboxEvents).where(eq(deviceOutboxEvents.id, "o-http-err")).all();
        expect(rows[0]!.status).toBe("error");
    });
});

