import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
    createDeletePersonFlow,
    createDeletePersonsBulkFlow,
    createPersonsService,
    PersonNotFoundError
} from "@school-gate/core";
import {
    outboxEvents,
    personTerminalIdentities,
    persons,
    subscriptionRequests,
    subscriptions
} from "@school-gate/db/schema/index";
import { createOutboxRepo } from "@school-gate/infra/drizzle/repos/outbox.repo";
import { createPersonTerminalIdentitiesRepo } from "@school-gate/infra/drizzle/repos/personTerminalIdentities.repo";
import { createPersonsRepo } from "@school-gate/infra/drizzle/repos/persons.repo";
import { createSubscriptionRequestsRepo } from "@school-gate/infra/drizzle/repos/subscriptionRequests.repo";
import { createSubscriptionsRepo } from "@school-gate/infra/drizzle/repos/subscriptions.repo";
import { createUnitOfWork } from "@school-gate/infra/drizzle/unitOfWork";
import { createTestDb } from "../helpers/testDb.js";

describe("DeletePerson flow", () => {
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
        await db.delete(personTerminalIdentities);
        await db.delete(subscriptions);
        await db.delete(subscriptionRequests);
        await db.delete(persons);
    });

    function createDeleteFlow() {
        const personsRepo = createPersonsRepo(db);

        return createDeletePersonFlow({
            personsService: createPersonsService({ personsRepo }),
            tx: createUnitOfWork(db, {
                personsRepo: createPersonsRepo,
                personTerminalIdentitiesRepo: createPersonTerminalIdentitiesRepo,
                subscriptionsRepo: createSubscriptionsRepo,
                subscriptionRequestsRepo: createSubscriptionRequestsRepo,
                outbox: createOutboxRepo
            }),
            idGen: {
                nextId: () => "outbox-delete-1"
            },
            clock: {
                now: () => new Date("2026-03-02T12:00:00.000Z")
            }
        });
    }

    it("deletes person, detaches identities, deactivates subscriptions, and resets linked requests", async () => {
        const personsRepo = createPersonsRepo(db);
        const identitiesRepo = createPersonTerminalIdentitiesRepo(db);
        const subscriptionsRepo = createSubscriptionsRepo(db);
        const requestsRepo = createSubscriptionRequestsRepo(db);
        const deletePerson = createDeleteFlow();

        await personsRepo.create({ id: "p1", iin: "030512550123", firstName: "Alihan" });
        await personsRepo.create({ id: "p2", iin: "030512550999", firstName: "Other" });
        await identitiesRepo.create({ id: "pti-1", personId: "p1", deviceId: "dev-1", terminalPersonId: "T-1" });
        await identitiesRepo.create({ id: "pti-2", personId: "p2", deviceId: "dev-2", terminalPersonId: "T-2" });
        await subscriptionsRepo.upsertActive({ id: "sub-1", tgUserId: "tg-1", personId: "p1" });
        await subscriptionsRepo.upsertActive({ id: "sub-2", tgUserId: "tg-2", personId: "p2" });
        await requestsRepo.createPending({ id: "req-1", tgUserId: "tg-1", iin: "030512550123" });
        await requestsRepo.markReadyForReview({ id: "req-1", personId: "p1", resolvedAt: new Date("2026-03-01T10:00:00.000Z") });
        await requestsRepo.createPending({ id: "req-2", tgUserId: "tg-2", iin: "030512550123" });
        await requestsRepo.markReadyForReview({ id: "req-2", personId: "p1", resolvedAt: new Date("2026-03-01T11:00:00.000Z") });
        await requestsRepo.updateStatus({
            id: "req-2",
            status: "approved",
            reviewedAt: new Date("2026-03-01T11:05:00.000Z"),
            reviewedBy: "admin-1"
        });

        const result = await deletePerson({ personId: "p1", adminId: "admin-1" });

        expect(result).toEqual({
            personId: "p1",
            deleted: true,
            detachedIdentities: 1,
            deactivatedSubscriptions: 1,
            unlinkedRequests: 2,
            resetRequestsToNeedsPerson: 1
        });
        await expect(personsRepo.getById("p1")).resolves.toBeNull();
        await expect(personsRepo.getById("p2")).resolves.not.toBeNull();
        await expect(identitiesRepo.listByPersonId({ personId: "p1" })).resolves.toEqual([]);

        const removedSubscription = await subscriptionsRepo.listByTgUserId({ tgUserId: "tg-1" });
        expect(removedSubscription[0]?.isActive).toBe(false);
        const preservedSubscription = await subscriptionsRepo.listByTgUserId({ tgUserId: "tg-2", onlyActive: true });
        expect(preservedSubscription).toHaveLength(1);

        const req1 = await requestsRepo.getById("req-1");
        expect(req1?.personId).toBeNull();
        expect(req1?.resolutionStatus).toBe("needs_person");
        expect(req1?.resolutionMessage).toBe("linked_person_deleted");

        const req2 = await requestsRepo.getById("req-2");
        expect(req2?.personId).toBeNull();
        expect(req2?.status).toBe("approved");

        const events = await db.select().from(outboxEvents);
        expect(events).toHaveLength(1);
        const auditPayload = JSON.parse(events[0]!.payloadJson);
        expect(auditPayload.action).toBe("person_deleted");
        expect(auditPayload.meta).toMatchObject({
            iin: "030512550123",
            detachedIdentities: 1,
            deactivatedSubscriptions: 1,
            unlinkedRequests: 2,
            resetRequestsToNeedsPerson: 1
        });
    });

    it("returns mixed results for bulk deletion", async () => {
        const personsRepo = createPersonsRepo(db);
        const deletePerson = createDeleteFlow();
        const bulkDelete = createDeletePersonsBulkFlow({ deletePerson });

        await personsRepo.create({ id: "p1", iin: "030512550123" });

        const result = await bulkDelete({
            personIds: ["p1", "missing", "p1"],
            adminId: "admin-1"
        });

        expect(result.total).toBe(2);
        expect(result.deleted).toBe(1);
        expect(result.notFound).toBe(1);
        expect(result.errors).toBe(0);
        expect(result.results).toEqual([
            {
                personId: "p1",
                status: "deleted",
                deleted: true,
                detachedIdentities: 0,
                deactivatedSubscriptions: 0,
                unlinkedRequests: 0,
                resetRequestsToNeedsPerson: 0
            },
            {
                personId: "missing",
                status: "not_found",
                message: "Person was not found"
            }
        ]);
    });

    it("throws when deleting a missing person", async () => {
        const deletePerson = createDeleteFlow();

        await expect(deletePerson({ personId: "missing", adminId: "admin-1" })).rejects.toBeInstanceOf(PersonNotFoundError);
    });
});
