import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { accessEvents, outboxEvents, persons, subscriptions } from "@school-gate/db/schema/index";
import { createAccessEventsRepo } from "@school-gate/infra/drizzle/repos/accessEvents.repo";
import { createPersonsRepo } from "@school-gate/infra/drizzle/repos/persons.repo";
import { createSubscriptionsRepo } from "@school-gate/infra/drizzle/repos/subscriptions.repo";
import { createPersonTerminalIdentitiesRepo } from "@school-gate/infra/drizzle/repos/personTerminalIdentities.repo";
import { createOutboxRepo } from "@school-gate/infra/drizzle/repos/outbox.repo";
import { createUnitOfWork } from "@school-gate/infra/drizzle/unitOfWork";
import { createProcessAccessEventByIdUC } from "@school-gate/core/usecases/processAccessEvents";
import { DomainEvents } from "@school-gate/core/events/domain";

describe("ProcessAccessEventByIdUC", () => {
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

    it("processes claimed event by id", async () => {
        const accessEventsRepo = createAccessEventsRepo(db);
        const personsRepo = createPersonsRepo(db);
        const subsRepo = createSubscriptionsRepo(db);
        const ptiRepo = createPersonTerminalIdentitiesRepo(db);

        await personsRepo.create({ id: "p1", iin: "030512550123" });
        await subsRepo.upsertActive({ id: "s1", tgUserId: "tg1", personId: "p1" });

        await accessEventsRepo.insertIdempotent({
            id: "ae1",
            deviceId: "dev1",
            direction: "IN",
            occurredAt: new Date("2020-01-01T00:00:00.000Z"),
            iin: "030512550123",
            idempotencyKey: "dev1:ev1"
        });

        const tx = createUnitOfWork(db, {
            accessEventsRepo: createAccessEventsRepo,
            outbox: createOutboxRepo
        });

        const uc = createProcessAccessEventByIdUC({
            accessEventsRepo,
            personsRepo,
            personTerminalIdentitiesRepo: ptiRepo,
            subscriptionsRepo: subsRepo,
            tx,
            idGen: { nextId: () => "out-1" },
            clock: { now: () => new Date("2020-01-01T00:01:00.000Z") }
        });

        const res = await uc({
            id: "ae1",
            retryDelayMs: 1000,
            leaseMs: 60_000,
            processingBy: "inline-1",
            maxAttempts: 3
        });

        expect(res.status).toBe("processed");
        expect(res.notifications).toBe(1);

        const stored = await db.select().from(accessEvents);
        expect(stored[0]!.status).toBe("PROCESSED");

        const out = await db.select().from(outboxEvents);
        expect(out).toHaveLength(1);
        expect(out[0]!.type).toBe(DomainEvents.PARENT_NOTIFICATION_REQUESTED);
    });
});

