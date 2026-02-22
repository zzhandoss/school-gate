import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { persons, subscriptions } from "@school-gate/db/schema/index";
import { createPersonsRepo } from "@school-gate/infra/drizzle/repos/persons.repo";
import { createSubscriptionsRepo } from "@school-gate/infra/drizzle/repos/subscriptions.repo";

describe("SubscriptionsRepo", () => {
    let db: ReturnType<typeof createTestDb>["db"];
    let cleanup: () => void;

    beforeAll(() => {
        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;
    });

    afterAll(() => cleanup());

    beforeEach(async () => {
        await db.delete(subscriptions);
        await db.delete(persons);
    });

    it("upsertActive creates subscription", async () => {
        const personsRepo = createPersonsRepo(db);
        const repo = createSubscriptionsRepo(db);

        await personsRepo.create({ id: "p1", iin: "030512550123" });

        await repo.upsertActive({ id: "s1", tgUserId: "tg1", personId: "p1" });

        const list = await repo.listActiveByPersonId("p1");
        expect(list).toHaveLength(1);
        expect(list[0]!.tgUserId).toBe("tg1");
        expect(list[0]!.isActive).toBe(true);
    });

    it("upsertActive re-activates existing inactive subscription", async () => {
        const personsRepo = createPersonsRepo(db);
        const repo = createSubscriptionsRepo(db);

        await personsRepo.create({ id: "p1", iin: "030512550123" });

        await repo.upsertActive({ id: "s1", tgUserId: "tg1", personId: "p1" });
        await repo.deactivate({ tgUserId: "tg1", personId: "p1" });

        let list = await repo.listActiveByPersonId("p1");
        expect(list).toHaveLength(0);

        await repo.upsertActive({ id: "s2", tgUserId: "tg1", personId: "p1" });

        list = await repo.listActiveByPersonId("p1");
        expect(list).toHaveLength(1);
        expect(list[0]!.tgUserId).toBe("tg1");
        expect(list[0]!.isActive).toBe(true);
    });

    it("listActiveByPersonId returns only active subscriptions", async () => {
        const personsRepo = createPersonsRepo(db);
        const repo = createSubscriptionsRepo(db);

        await personsRepo.create({ id: "p1", iin: "030512550123" });

        await repo.upsertActive({ id: "s1", tgUserId: "tg1", personId: "p1" });
        await repo.upsertActive({ id: "s2", tgUserId: "tg2", personId: "p1" });

        await repo.deactivate({ tgUserId: "tg1", personId: "p1" });

        const list = await repo.listActiveByPersonId("p1");
        const tgIds = list.map((x) => x.tgUserId);

        expect(tgIds).toContain("tg2");
        expect(tgIds).not.toContain("tg1");
    });

    it("deactivate is idempotent (no throw if not exists)", async () => {
        const repo = createSubscriptionsRepo(db);

        await expect(repo.deactivate({ tgUserId: "tg1", personId: "p1" })).resolves.toBeUndefined();
    });

    it("listByTgUserId returns all subscriptions for user", async () => {
        const personsRepo = createPersonsRepo(db);
        const repo = createSubscriptionsRepo(db);

        await personsRepo.create({ id: "p1", iin: "030512550123" });
        await personsRepo.create({ id: "p2", iin: "040512550123" });

        await repo.upsertActive({ id: "s1", tgUserId: "tg1", personId: "p1" });
        await repo.upsertActive({ id: "s2", tgUserId: "tg1", personId: "p2" });
        await repo.upsertActive({ id: "s3", tgUserId: "tg2", personId: "p1" });

        const list = await repo.listByTgUserId({ tgUserId: "tg1" });

        expect(list).toHaveLength(2);
        expect(list.every((x) => x.tgUserId === "tg1")).toBe(true);

        const personIds = list.map((x) => x.personId);
        expect(personIds).toContain("p1");
        expect(personIds).toContain("p2");
    });

    it("listByTgUserId onlyActive=true filters inactive", async () => {
        const personsRepo = createPersonsRepo(db);
        const repo = createSubscriptionsRepo(db);

        await personsRepo.create({ id: "p1", iin: "030512550123" });

        await repo.upsertActive({ id: "s1", tgUserId: "tg1", personId: "p1" });
        await repo.deactivate({ tgUserId: "tg1", personId: "p1" });

        const all = await repo.listByTgUserId({ tgUserId: "tg1" });
        expect(all).toHaveLength(1);

        const activeOnly = await repo.listByTgUserId({ tgUserId: "tg1", onlyActive: true });
        expect(activeOnly).toHaveLength(0);
    });

    it("getById and getByIdSync return subscription by id", async () => {
        const personsRepo = createPersonsRepo(db);
        const repo = createSubscriptionsRepo(db);

        await personsRepo.create({ id: "p1", iin: "030512550123" });
        await repo.upsertActive({ id: "s1", tgUserId: "tg1", personId: "p1" });

        const asyncSub = await repo.getById("s1");
        const syncSub = repo.getByIdSync("s1");

        expect(asyncSub).not.toBeNull();
        expect(syncSub).not.toBeNull();
        expect(asyncSub!.tgUserId).toBe("tg1");
        expect(syncSub!.personId).toBe("p1");
    });
});

