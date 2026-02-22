import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { accessEvents, outboxEvents, persons, subscriptions } from "@school-gate/db/schema/index";
import { createAccessEventsRepo } from "@school-gate/infra/drizzle/repos/accessEvents.repo";
import { createPersonsRepo } from "@school-gate/infra/drizzle/repos/persons.repo";
import { createSubscriptionsRepo } from "@school-gate/infra/drizzle/repos/subscriptions.repo";
import { createPersonTerminalIdentitiesRepo } from "@school-gate/infra/drizzle/repos/personTerminalIdentities.repo";
import { createOutboxRepo } from "@school-gate/infra/drizzle/repos/outbox.repo";
import { createUnitOfWork } from "@school-gate/infra/drizzle/unitOfWork";
import { createProcessAccessEventsUC } from "@school-gate/core/usecases/processAccessEvents";
import { DomainEvents } from "@school-gate/core/events/domain";

describe("ProcessAccessEventsUC", () => {
    let db: ReturnType<typeof createTestDb>["db"];
    let cleanup: () => void;

    beforeAll(() => {
        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;
    });

    afterAll(() => cleanup());

    beforeEach(async () => {
        await db.delete(outboxEvents);
        await db.delete(accessEvents);
        await db.delete(subscriptions);
        await db.delete(persons);
    });

    it("enqueues notifications and marks event processed when person is resolved", async () => {
        const accessEventsRepo = createAccessEventsRepo(db);
        const personsRepo = createPersonsRepo(db);
        const subsRepo = createSubscriptionsRepo(db);
        const ptiRepo = createPersonTerminalIdentitiesRepo(db);

        await personsRepo.create({ id: "p1", iin: "030512550123", firstName: "Ivan", lastName: "Ivanov" });
        await subsRepo.upsertActive({ id: "s1", tgUserId: "tg1", personId: "p1" });

        await accessEventsRepo.insertIdempotent({
            id: "ae1",
            deviceId: "dev1",
            direction: "IN",
            occurredAt: new Date("2020-01-01T00:00:00.000Z"),
            iin: "030512550123",
            idempotencyKey: "dev1:ev1",
        });

        const tx = createUnitOfWork(db, {
            accessEventsRepo: createAccessEventsRepo,
            outbox: createOutboxRepo,
        });

        const uc = createProcessAccessEventsUC({
            accessEventsRepo,
            personsRepo,
            personTerminalIdentitiesRepo: ptiRepo,
            subscriptionsRepo: subsRepo,
            tx,
            idGen: { nextId: () => "out-1" },
            clock: { now: () => new Date("2020-01-01T00:01:00.000Z") },
        });

        const res = await uc({
            limit: 10,
            retryDelayMs: 1000,
            leaseMs: 60_000,
            processingBy: "worker-1",
            maxAttempts: 3,
        });
        expect(res.processed).toBe(1);
        expect(res.notifications).toBe(1);

        const stored = await db.select().from(accessEvents);
        expect(stored[0]!.status).toBe("PROCESSED");

        const out = await db.select().from(outboxEvents);
        expect(out).toHaveLength(1);
        expect(out[0]!.type).toBe(DomainEvents.PARENT_NOTIFICATION_REQUESTED);
        const payload = JSON.parse(out[0]!.payloadJson);
        expect(payload.tgUserId).toBe("tg1");
        expect(payload.iin).toBe("030512550123");
    });

    it("marks event as unmatched when person cannot be resolved", async () => {
        const accessEventsRepo = createAccessEventsRepo(db);
        const personsRepo = createPersonsRepo(db);
        const subsRepo = createSubscriptionsRepo(db);
        const ptiRepo = createPersonTerminalIdentitiesRepo(db);

        await accessEventsRepo.insertIdempotent({
            id: "ae2",
            deviceId: "dev1",
            direction: "OUT",
            occurredAt: new Date("2020-01-01T00:00:00.000Z"),
            terminalPersonId: "T-404",
            idempotencyKey: "dev1:ev2",
        });

        const tx = createUnitOfWork(db, {
            accessEventsRepo: createAccessEventsRepo,
            outbox: createOutboxRepo,
        });

        const uc = createProcessAccessEventsUC({
            accessEventsRepo,
            personsRepo,
            personTerminalIdentitiesRepo: ptiRepo,
            subscriptionsRepo: subsRepo,
            tx,
            idGen: { nextId: () => "out-2" },
            clock: { now: () => new Date("2020-01-01T00:01:00.000Z") },
        });

        const res = await uc({
            limit: 10,
            retryDelayMs: 1000,
            leaseMs: 60_000,
            processingBy: "worker-1",
            maxAttempts: 3,
        });
        expect(res.unmatched).toBe(1);

        const stored = await db.select().from(accessEvents);
        expect(stored[0]!.status).toBe("UNMATCHED");
    });

    it("marks event processed when person exists but no subscriptions", async () => {
        const accessEventsRepo = createAccessEventsRepo(db);
        const personsRepo = createPersonsRepo(db);
        const subsRepo = createSubscriptionsRepo(db);
        const ptiRepo = createPersonTerminalIdentitiesRepo(db);

        await personsRepo.create({ id: "p1", iin: "030512550123" });

        await accessEventsRepo.insertIdempotent({
            id: "ae3",
            deviceId: "dev1",
            direction: "IN",
            occurredAt: new Date("2020-01-01T00:00:00.000Z"),
            iin: "030512550123",
            idempotencyKey: "dev1:ev3",
        });

        const tx = createUnitOfWork(db, {
            accessEventsRepo: createAccessEventsRepo,
            outbox: createOutboxRepo,
        });

        const uc = createProcessAccessEventsUC({
            accessEventsRepo,
            personsRepo,
            personTerminalIdentitiesRepo: ptiRepo,
            subscriptionsRepo: subsRepo,
            tx,
            idGen: { nextId: () => "out-3" },
            clock: { now: () => new Date("2020-01-01T00:01:00.000Z") },
        });

        const res = await uc({
            limit: 10,
            retryDelayMs: 1000,
            leaseMs: 60_000,
            processingBy: "worker-1",
            maxAttempts: 3,
        });

        expect(res.processed).toBe(1);
        expect(res.notifications).toBe(0);

        const stored = await db.select().from(accessEvents);
        expect(stored[0]!.status).toBe("PROCESSED");
    });
});

