import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
    SubscriptionAccessDeniedError,
    SubscriptionNotFoundError,
    createSetParentSubscriptionStatusFlow
} from "@school-gate/core";
import { outboxEvents, persons, subscriptions } from "@school-gate/db/schema/index";
import { createOutbox } from "@school-gate/infra/drizzle/repos/outbox.repo";
import { createPersonsRepo } from "@school-gate/infra/drizzle/repos/persons.repo";
import { createSubscriptionsRepo } from "@school-gate/infra/drizzle/repos/subscriptions.repo";
import { createUnitOfWork } from "@school-gate/infra/drizzle/unitOfWork";
import { createTestDb } from "../helpers/testDb.js";

describe("setParentSubscriptionStatusFlow", () => {
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
        await db.delete(subscriptions);
        await db.delete(persons);
    });

    it("updates own subscription and writes audit event", async () => {
        const personsRepo = createPersonsRepo(db);
        const subscriptionsRepo = createSubscriptionsRepo(db);

        await personsRepo.create({ id: "p1", iin: "030512550123" });
        await subscriptionsRepo.upsertActive({ id: "s1", tgUserId: "tg1", personId: "p1" });

        const flow = createSetParentSubscriptionStatusFlow({
            tx: createUnitOfWork(db, {
                subscriptionsRepo: createSubscriptionsRepo,
                outbox: createOutbox
            }),
            idGen: { nextId: () => "outbox-1" },
            clock: { now: () => new Date("2020-01-01T00:00:00.000Z") }
        });

        const result = await flow({ tgUserId: "tg1", subscriptionId: "s1", isActive: false });
        expect(result).toEqual({ id: "s1", isActive: false });

        const subscription = await subscriptionsRepo.getById("s1");
        expect(subscription!.isActive).toBe(false);

        const events = await db.select().from(outboxEvents);
        expect(events).toHaveLength(1);
        const payload = JSON.parse(events[0]!.payloadJson);
        expect(payload.actorId).toBe("parent:tg1");
        expect(payload.action).toBe("parent_subscription_deactivated");
    });

    it("throws not found for unknown subscription", async () => {
        const flow = createSetParentSubscriptionStatusFlow({
            tx: createUnitOfWork(db, {
                subscriptionsRepo: createSubscriptionsRepo,
                outbox: createOutbox
            }),
            idGen: { nextId: () => "outbox-1" },
            clock: { now: () => new Date() }
        });

        await expect(
            flow({ tgUserId: "tg1", subscriptionId: "missing", isActive: true })
        ).rejects.toBeInstanceOf(SubscriptionNotFoundError);
    });

    it("throws access denied for subscription owned by another user", async () => {
        const personsRepo = createPersonsRepo(db);
        const subscriptionsRepo = createSubscriptionsRepo(db);

        await personsRepo.create({ id: "p1", iin: "030512550123" });
        await subscriptionsRepo.upsertActive({ id: "s1", tgUserId: "tg2", personId: "p1" });

        const flow = createSetParentSubscriptionStatusFlow({
            tx: createUnitOfWork(db, {
                subscriptionsRepo: createSubscriptionsRepo,
                outbox: createOutbox
            }),
            idGen: { nextId: () => "outbox-1" },
            clock: { now: () => new Date() }
        });

        await expect(
            flow({ tgUserId: "tg1", subscriptionId: "s1", isActive: false })
        ).rejects.toBeInstanceOf(SubscriptionAccessDeniedError);

        const events = await db.select().from(outboxEvents);
        expect(events).toHaveLength(0);
    });
});
