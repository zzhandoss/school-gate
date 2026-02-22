import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { createPreprocessPendingRequestsUC } from "@school-gate/core/usecases/preprocessPendingRequests";
import { createSubscriptionRequestsRepo } from "@school-gate/infra/drizzle/repos/subscriptionRequests.repo";
import { createPersonTerminalIdentitiesRepo } from "@school-gate/infra/drizzle/repos/personTerminalIdentities.repo";
import { createPersonsRepo } from "@school-gate/infra/drizzle/repos/persons.repo";
import { persons, personTerminalIdentities, subscriptionRequests } from "@school-gate/db/schema/index";



describe("PreprocessPendingRequestsUC", () => {
    let db: ReturnType<typeof createTestDb>["db"];
    let cleanup: () => void;

    beforeAll(() => {
        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;
    });

    afterAll(() => cleanup());

    beforeEach(async () => {
        await db.delete(personTerminalIdentities);
        await db.delete(subscriptionRequests);
        await db.delete(persons);
    });

    it("marks ready_for_review if person exists in system", async () => {
        const personsRepo = createPersonsRepo(db);
        const subscriptionRequestsRepo = createSubscriptionRequestsRepo(db);
        const ptiRepo = createPersonTerminalIdentitiesRepo(db);

        await personsRepo.create({ id: "p1", iin: "030512550123" });
        await subscriptionRequestsRepo.createPending({ id: "r1", tgUserId: "tg1", iin: "030512550123" });

        const uc = createPreprocessPendingRequestsUC({
            personsRepo,
            subscriptionRequestsRepo,
            personTerminalIdentitiesRepo: ptiRepo,
            personResolver: { resolveByIin: async () => ({ kind: "not_found" as const }) },
            flags: { autoResolvePersonByIin: true },
            idGen: { nextId: () => "x" },
            clock: { now: () => new Date("2020-01-01T00:00:00.000Z") }
        });

        const res = await uc({ limit: 10 });
        expect(res.ready).toBe(1);

        const req = await subscriptionRequestsRepo.getById("r1");
        expect(req!.resolutionStatus).toBe("ready_for_review");
        expect(req!.personId).toBe("p1");
    });

    it("marks needs_person if autoResolve is disabled and person is missing", async () => {
        const personsRepo = createPersonsRepo(db);
        const subscriptionRequestsRepo = createSubscriptionRequestsRepo(db);
        const ptiRepo = createPersonTerminalIdentitiesRepo(db);

        await subscriptionRequestsRepo.createPending({ id: "r1", tgUserId: "tg1", iin: "030512550123" });

        const uc = createPreprocessPendingRequestsUC({
            personsRepo,
            subscriptionRequestsRepo,
            personTerminalIdentitiesRepo: ptiRepo,
            personResolver: { resolveByIin: async () => ({ kind: "not_found" as const }) },
            flags: { autoResolvePersonByIin: false },
            idGen: { nextId: () => "x" },
            clock: { now: () => new Date() }
        });

        const res = await uc({ limit: 10 });
        expect(res.needsPerson).toBe(1);

        const req = await subscriptionRequestsRepo.getById("r1");
        expect(req!.resolutionStatus).toBe("needs_person");
        expect(req!.personId).toBeNull();
    });

    it("auto-resolve creates person and marks ready_for_review when found", async () => {
        const personsRepo = createPersonsRepo(db);
        const subscriptionRequestsRepo = createSubscriptionRequestsRepo(db);
        const ptiRepo = createPersonTerminalIdentitiesRepo(db);
        await subscriptionRequestsRepo.createPending({ id: "r1", tgUserId: "tg1", iin: "030512550123" });

        let ids = ["p-new", "pti-new1", "pti-new2"];
        const uc = createPreprocessPendingRequestsUC({
            personsRepo,
            subscriptionRequestsRepo,
            personTerminalIdentitiesRepo: ptiRepo,
            personResolver: {
                resolveByIin: async () => ({
                    kind: "found" as const,
                    firstName: "A",
                    lastName: "B",
                    mappings: [
                        { deviceId: "dev1", terminalPersonId: "T-1" },
                        { deviceId: "dev2", terminalPersonId: "T-2" }
                    ]
                })
            },
            flags: { autoResolvePersonByIin: true },
            idGen: { nextId: () => ids.shift()! },
            clock: { now: () => new Date() }
        });

        const res = await uc({ limit: 10 });
        expect(res.ready).toBe(1);
        expect(res.errors).toBe(0);

        const p = await personsRepo.getByIin("030512550123");
        expect(p).not.toBeNull();
        expect(p!.id).toBe("p-new");

        const maps = await ptiRepo.listByPersonId({ personId: "p-new" });
        expect(maps).toHaveLength(2);

        const req = await subscriptionRequestsRepo.getById("r1");
        expect(req!.resolutionStatus).toBe("ready_for_review");
        expect(req!.personId).toBe("p-new");
    });
});

