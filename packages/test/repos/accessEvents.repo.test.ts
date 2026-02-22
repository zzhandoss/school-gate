import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { accessEvents } from "@school-gate/db/schema/index";
import { createAccessEventsRepo } from "@school-gate/infra/drizzle/repos/accessEvents.repo";

describe("AccessEventsRepo", () => {
    let db: ReturnType<typeof createTestDb>["db"];
    let cleanup: () => void;

    beforeAll(() => {
        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;
    });

    afterAll(() => {
        cleanup();
    });

    beforeEach(async () => {
        await db.delete(accessEvents);
    });

    it("insertIdempotent inserts once and duplicates next time", async () => {
        const repo = createAccessEventsRepo(db);
        const now = new Date();

        const r1 = await repo.insertIdempotent({
            id: "e1",
            deviceId: "d1",
            direction: "IN",
            occurredAt: now,
            idempotencyKey: "k1",
            rawPayload: "{}"
        });

        const r2 = await repo.insertIdempotent({
            id: "e2",
            deviceId: "d1",
            direction: "IN",
            occurredAt: now,
            idempotencyKey: "k1",
            rawPayload: "{}"
        });

        expect(r1).toBe("inserted");
        expect(r2).toBe("duplicate");
    });

    it("listDueForProcessing returns NEW and due FAILED_RETRY", async () => {
        const repo = createAccessEventsRepo(db);
        const now = new Date();

        await repo.insertIdempotent({
            id: "n1",
            deviceId: "d1",
            direction: "IN",
            occurredAt: new Date(now.getTime() - 1000),
            idempotencyKey: "kn1"
        });

        await repo.insertIdempotent({
            id: "f1",
            deviceId: "d1",
            direction: "OUT",
            occurredAt: new Date(now.getTime() - 2000),
            idempotencyKey: "kf1"
        });

        await repo.markFailed({
            id: "f1",
            error: "boom",
            attempts: 1,
            maxAttempts: 3,
            nextAttemptAt: new Date(now.getTime() - 500)
        });

        const due = await repo.listDueForProcessing({ limit: 10, now });
        const ids = due.map((x) => x.id);

        expect(ids).toContain("n1");
        expect(ids).toContain("f1");
    });

    it("deleteOlderThan returns deleted rows count", async () => {
        const repo = createAccessEventsRepo(db);
        const now = new Date();

        await repo.insertIdempotent({
            id: "old1",
            deviceId: "d1",
            direction: "IN",
            occurredAt: new Date(now.getTime() - 40 * 24 * 3600 * 1000), // 40 дней назад
            idempotencyKey: "kold1"
        });

        await repo.insertIdempotent({
            id: "new1",
            deviceId: "d1",
            direction: "OUT",
            occurredAt: new Date(now.getTime() - 1 * 24 * 3600 * 1000), // 1 день назад
            idempotencyKey: "knew1"
        });

        const deleted = await repo.deleteOlderThan({
            before: new Date(now.getTime() - 30 * 24 * 3600 * 1000)
        });

        expect(deleted).toBe(1);
    });

    it("claimBatch marks events as processing", async () => {
        const repo = createAccessEventsRepo(db);
        const now = new Date();

        await repo.insertIdempotent({
            id: "c1",
            deviceId: "d1",
            direction: "IN",
            occurredAt: now,
            idempotencyKey: "kc1"
        });

        const claimed = await repo.claimBatch({
            limit: 10,
            now,
            leaseMs: 60_000,
            processingBy: "worker-1"
        });

        expect(claimed).toHaveLength(1);

        const rows = await db.select().from(accessEvents);
        expect(rows[0]!.status).toBe("PROCESSING");
        expect(rows[0]!.processingBy).toBe("worker-1");
        expect(rows[0]!.attempts).toBe(1);
    });

    it("markFailed sets error after max attempts", async () => {
        const repo = createAccessEventsRepo(db);
        const now = new Date();

        await db.insert(accessEvents).values({
            id: "f1",
            deviceId: "d1",
            direction: "OUT",
            occurredAt: now,
            idempotencyKey: "kf1",
            status: "PROCESSING",
            attempts: 1,
            processingAt: now,
            processingBy: "worker-1"
        });

        await repo.markFailed({
            id: "f1",
            error: "boom",
            attempts: 1,
            maxAttempts: 1,
            nextAttemptAt: new Date(now.getTime() + 1000)
        });

        const rows = await db.select().from(accessEvents);
        expect(rows[0]!.status).toBe("ERROR");
        expect(rows[0]!.lastError).toBe("boom");
        expect(rows[0]!.nextAttemptAt).toBeNull();
    });
});



