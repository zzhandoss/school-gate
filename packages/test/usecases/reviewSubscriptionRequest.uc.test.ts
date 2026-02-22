import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { createReviewSubscriptionRequestUC } from "@school-gate/core/usecases/reviewSubscriptionRequest";
import {
    SubscriptionRequestNotFoundError,
    SubscriptionRequestNotPendingError,
    SubscriptionRequestNotReadyError
} from "@school-gate/core/utils/errors";
import { DomainEvents } from "@school-gate/core/events/domain";
import { outboxEvents, persons, subscriptionRequests, subscriptions } from "@school-gate/db/schema/index";
import { createPersonsRepo } from "@school-gate/infra/drizzle/repos/persons.repo";
import { createOutboxRepo } from "@school-gate/infra/drizzle/repos/outbox.repo";
import { createSubscriptionRequestsRepo } from "@school-gate/infra/drizzle/repos/subscriptionRequests.repo";
import { createSubscriptionsRepo } from "@school-gate/infra/drizzle/repos/subscriptions.repo";
import { createUnitOfWork } from "@school-gate/infra/drizzle/unitOfWork";

describe("ReviewSubscriptionRequestUC", () => {
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
        await db.delete(subscriptionRequests);
        await db.delete(persons);
    });

    it("approve: creates subscription and marks request approved (only when ready)", async () => {
        const personsRepo = createPersonsRepo(db);
        const subscriptionRequestsRepo = createSubscriptionRequestsRepo(db);
        const subscriptionsRepo = createSubscriptionsRepo(db);

        await personsRepo.create({ id: "p1", iin: "030512550123" });
        await subscriptionRequestsRepo.createPending({ id: "r1", tgUserId: "tg1", iin: "030512550123" });
        await subscriptionRequestsRepo.markReadyForReview({
            id: "r1",
            personId: "p1",
            resolvedAt: new Date()
        });

        const tx = createUnitOfWork(db, {
            subscriptionRequestsRepo: createSubscriptionRequestsRepo,
            subscriptionsRepo: createSubscriptionsRepo,
            outbox: createOutboxRepo
        });

        const ids = ["sub-1", "outbox-1", "outbox-2", "alert-event-1"];
        const uc = createReviewSubscriptionRequestUC({
            tx,
            idGen: { nextId: () => ids.shift()! },
            clock: { now: () => new Date("2020-01-01T00:00:00.000Z") },
            subscriptionRequestsRepo: subscriptionRequestsRepo
        });

        const res = await uc({ requestId: "r1", adminTgUserId: "admin1", decision: "approve" });
        expect(res.status).toBe("approved");
        expect(res.personId).toBe("p1");

        const req = await subscriptionRequestsRepo.getById("r1");
        expect(req!.status).toBe("approved");
        expect(req!.reviewedBy).toBe("admin1");
        expect(req!.reviewedAt).not.toBeNull();

        const list = await subscriptionsRepo.listByTgUserId({ tgUserId: "tg1", onlyActive: true });
        expect(list).toHaveLength(1);
        expect(list[0]!.personId).toBe("p1");

        const events = await db.select().from(outboxEvents);
        expect(events).toHaveLength(2);

        const auditEvent = events.find((item) => item.type === DomainEvents.AUDIT_REQUESTED);
        expect(auditEvent?.id).toBe("outbox-1");
        expect(auditEvent?.status).toBe("new");

        const auditPayload = JSON.parse(auditEvent!.payloadJson);
        expect(auditPayload.action).toBe("subscription_request_approved");

        const notificationEvent = events.find((item) => item.type === DomainEvents.ALERT_NOTIFICATION_REQUESTED);
        expect(notificationEvent?.id).toBe("outbox-2");
        expect(notificationEvent?.status).toBe("new");

        const notificationPayload = JSON.parse(notificationEvent!.payloadJson);
        expect(notificationPayload.tgUserId).toBe("tg1");
        expect(notificationPayload.message).toContain("одобрена");
    });

    it("approve: throws if not ready_for_review", async () => {
        const subscriptionRequestsRepo = createSubscriptionRequestsRepo(db);

        await subscriptionRequestsRepo.createPending({ id: "r1", tgUserId: "tg1", iin: "030512550123" });
        await subscriptionRequestsRepo.markNeedsPerson({ id: "r1", message: "no person", resolvedAt: new Date() });

        const tx = createUnitOfWork(db, {
            subscriptionRequestsRepo: createSubscriptionRequestsRepo,
            subscriptionsRepo: createSubscriptionsRepo,
            outbox: createOutboxRepo
        });

        const uc = createReviewSubscriptionRequestUC({
            tx,
            idGen: { nextId: () => "x" },
            clock: { now: () => new Date() },
            subscriptionRequestsRepo: subscriptionRequestsRepo
        });

        await expect(
            uc({ requestId: "r1", adminTgUserId: "admin1", decision: "approve" })
        ).rejects.toBeInstanceOf(SubscriptionRequestNotReadyError);
    });

    it("reject: marks request rejected (even if not ready)", async () => {
        const subscriptionRequestsRepo = createSubscriptionRequestsRepo(db);

        await subscriptionRequestsRepo.createPending({ id: "r1", tgUserId: "tg1", iin: "030512550123" });
        await subscriptionRequestsRepo.markNeedsPerson({ id: "r1", message: "no person", resolvedAt: new Date() });

        const tx = createUnitOfWork(db, {
            subscriptionRequestsRepo: createSubscriptionRequestsRepo,
            subscriptionsRepo: createSubscriptionsRepo,
            outbox: createOutboxRepo
        });

        const ids = ["outbox-1", "outbox-2", "alert-event-1"];
        const uc = createReviewSubscriptionRequestUC({
            tx,
            idGen: { nextId: () => ids.shift()! },
            clock: { now: () => new Date("2020-01-01T00:00:00.000Z") },
            subscriptionRequestsRepo: subscriptionRequestsRepo
        });

        const res = await uc({ requestId: "r1", adminTgUserId: "admin1", decision: "reject" });
        expect(res.status).toBe("rejected");

        const req = await subscriptionRequestsRepo.getById("r1");
        expect(req!.status).toBe("rejected");
        expect(req!.reviewedBy).toBe("admin1");

        const events = await db.select().from(outboxEvents);
        expect(events).toHaveLength(2);

        const auditEvent = events.find((item) => item.type === DomainEvents.AUDIT_REQUESTED);
        expect(auditEvent?.id).toBe("outbox-1");
        const auditPayload = JSON.parse(auditEvent!.payloadJson);
        expect(auditPayload.action).toBe("subscription_request_rejected");

        const notificationEvent = events.find((item) => item.type === DomainEvents.ALERT_NOTIFICATION_REQUESTED);
        expect(notificationEvent?.id).toBe("outbox-2");
        const notificationPayload = JSON.parse(notificationEvent!.payloadJson);
        expect(notificationPayload.tgUserId).toBe("tg1");
        expect(notificationPayload.message).toContain("отклонена");
    });

    it("throws not found", async () => {
        const subscriptionRequestsRepo = createSubscriptionRequestsRepo(db);
        const tx = createUnitOfWork(db, {
            subscriptionRequestsRepo: createSubscriptionRequestsRepo,
            subscriptionsRepo: createSubscriptionsRepo,
            outbox: createOutboxRepo
        });

        const uc = createReviewSubscriptionRequestUC({
            tx,
            idGen: { nextId: () => "x" },
            clock: { now: () => new Date() },
            subscriptionRequestsRepo: subscriptionRequestsRepo
        });

        await expect(
            uc({ requestId: "missing", adminTgUserId: "admin1", decision: "reject" })
        ).rejects.toBeInstanceOf(SubscriptionRequestNotFoundError);
    });

    it("throws not pending (already reviewed)", async () => {
        const subscriptionRequestsRepo = createSubscriptionRequestsRepo(db);

        await subscriptionRequestsRepo.createPending({ id: "r1", tgUserId: "tg1", iin: "030512550123" });

        await subscriptionRequestsRepo.updateStatus({
            id: "r1",
            status: "approved",
            reviewedAt: new Date(),
            reviewedBy: "admin1"
        });

        const tx = createUnitOfWork(db, {
            subscriptionRequestsRepo: createSubscriptionRequestsRepo,
            subscriptionsRepo: createSubscriptionsRepo,
            outbox: createOutboxRepo
        });

        const uc = createReviewSubscriptionRequestUC({
            tx,
            idGen: { nextId: () => "x" },
            clock: { now: () => new Date() },
            subscriptionRequestsRepo: subscriptionRequestsRepo
        });

        await expect(
            uc({ requestId: "r1", adminTgUserId: "admin1", decision: "reject" })
        ).rejects.toBeInstanceOf(SubscriptionRequestNotPendingError);
    });
});

