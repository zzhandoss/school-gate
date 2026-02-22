import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { subscriptionRequests } from "@school-gate/db/schema/index";
import { createSubscriptionRequestsRepo } from "@school-gate/infra/drizzle/repos/subscriptionRequests.repo";

describe("SubscriptionRequestsRepo", () => {
    let db: ReturnType<typeof createTestDb>["db"];
    let cleanup: () => void;

    beforeAll(() => {
        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;
    });

    afterAll(() => cleanup());

    beforeEach(async () => {
        await db.delete(subscriptionRequests);
    });

    it("createPending + getById works", async () => {
        const repo = createSubscriptionRequestsRepo(db);

        await repo.createPending({ id: "r1", tgUserId: "tg1", iin: "030512550123" });

        const r = await repo.getById("r1");
        expect(r).not.toBeNull();
        expect(r!.status).toBe("pending");
        expect(r!.tgUserId).toBe("tg1");
        expect(r!.iin).toBe("030512550123");
        expect(r!.createdAt).toBeInstanceOf(Date);
        expect(r!.reviewedAt).toBeNull();
        expect(r!.reviewedBy).toBeNull();
    });

    it("getPendingByTgUserAndIin returns only pending", async () => {
        const repo = createSubscriptionRequestsRepo(db);

        await repo.createPending({ id: "r1", tgUserId: "tg1", iin: "030512550123" });

        // РїРѕРґС‚РІРµСЂРґРёРј
        await repo.updateStatus({
            id: "r1",
            status: "approved",
            reviewedAt: new Date(),
            reviewedBy: "admin1"
        });

        const pending = await repo.getPendingByTgUserAndIin({ tgUserId: "tg1", iin: "030512550123" });
        expect(pending).toBeNull();
    });

    it("updateStatus sets reviewedAt/reviewedBy", async () => {
        const repo = createSubscriptionRequestsRepo(db);

        await repo.createPending({ id: "r1", tgUserId: "tg1", iin: "030512550123" });

        const reviewedAt = new Date();
        await repo.updateStatus({
            id: "r1",
            status: "rejected",
            reviewedAt,
            reviewedBy: "admin1"
        });

        const r = await repo.getById("r1");
        expect(r!.status).toBe("rejected");
        expect(r!.reviewedBy).toBe("admin1");
        expect(r!.reviewedAt).not.toBeNull();
    });

    it("createPending throws if pending already exists for same tgUserId + iin", async () => {
        const repo = createSubscriptionRequestsRepo(db);

        await repo.createPending({ id: "r1", tgUserId: "tg1", iin: "030512550123" });

        await expect(
            repo.createPending({ id: "r2", tgUserId: "tg1", iin: "030512550123" })
        ).rejects.toThrow("SUBSCRIPTION_REQUEST_PENDING_ALREADY_EXISTS");
    });

    it("listPendingNew returns only pending+new", async () => {
        const repo = createSubscriptionRequestsRepo(db);

        await repo.createPending({ id: "r1", tgUserId: "tg1", iin: "030512550123" });
        await repo.createPending({ id: "r2", tgUserId: "tg2", iin: "040512550123" });

        // r2 СЃРґРµР»Р°РµРј needs_person вЂ” С‚РѕРіРґР° РѕРЅ РЅРµ РґРѕР»Р¶РµРЅ РїРѕРїР°СЃС‚СЊ РІ listPendingNew
        await repo.markNeedsPerson({ id: "r2", message: "not found", resolvedAt: new Date() });

        const list = await repo.listPendingNew({ limit: 10 });
        const ids = list.map((x) => x.id);

        expect(ids).toContain("r1");
        expect(ids).not.toContain("r2");
    });

    it("markReadyForReview sets personId and keeps status pending", async () => {
        const repo = createSubscriptionRequestsRepo(db);

        await repo.createPending({ id: "r1", tgUserId: "tg1", iin: "030512550123" });

        const now = new Date();
        await repo.markReadyForReview({ id: "r1", personId: "p1", resolvedAt: now });

        const r = await repo.getById("r1");
        expect(r).not.toBeNull();

        expect(r!.status).toBe("pending");
        expect(r!.resolutionStatus).toBe("ready_for_review");
        expect(r!.personId).toBe("p1");
        expect(r!.resolvedAt).not.toBeNull();
        expect(r!.resolutionMessage).toBeNull();
    });

    it("markNeedsPerson sets message and keeps status pending", async () => {
        const repo = createSubscriptionRequestsRepo(db);

        await repo.createPending({ id: "r1", tgUserId: "tg1", iin: "030512550123" });

        const now = new Date();
        await repo.markNeedsPerson({ id: "r1", message: "Person not found in system", resolvedAt: now });

        const r = await repo.getById("r1");
        expect(r).not.toBeNull();

        expect(r!.status).toBe("pending");
        expect(r!.resolutionStatus).toBe("needs_person");
        expect(r!.personId).toBeNull();
        expect(r!.resolvedAt).not.toBeNull();
        expect(r!.resolutionMessage).toBe("Person not found in system");
    });

    it("listForAdmin supports filtering by resolutionStatus", async () => {
        const repo = createSubscriptionRequestsRepo(db);

        await repo.createPending({ id: "r_new", tgUserId: "tg1", iin: "030512550123" });

        await repo.createPending({ id: "r_ready", tgUserId: "tg2", iin: "040512550123" });
        await repo.markReadyForReview({ id: "r_ready", personId: "p1", resolvedAt: new Date() });

        await repo.createPending({ id: "r_need", tgUserId: "tg3", iin: "050512550123" });
        await repo.markNeedsPerson({ id: "r_need", message: "no person", resolvedAt: new Date() });

        const ready = await repo.listForAdmin({ limit: 10, only: "ready_for_review" });
        expect(ready.requests.map((x) => x.id)).toEqual(["r_ready"]);

        const need = await repo.listForAdmin({ limit: 10, only: "needs_person" });
        expect(need.requests.map((x) => x.id)).toEqual(["r_need"]);

        const news = await repo.listForAdmin({ limit: 10, only: "new" });
        expect(news.requests.map((x) => x.id)).toEqual(["r_new"]);
    });

    it("listForAdmin supports pagination", async () => {
        const repo = createSubscriptionRequestsRepo(db);

        for (let i = 0; i < 5; i++) {
            await repo.createPending({ id: `r${i}`, tgUserId: `tg${i}`, iin: `00000000000${i}`.slice(-12) });
        }

        const page1 = await repo.listForAdmin({ limit: 2, offset: 0 });
        const page2 = await repo.listForAdmin({ limit: 2, offset: 2 });

        expect(page1.requests).toHaveLength(2);
        expect(page2.requests).toHaveLength(2);
        expect(page1.total).toBe(5);
        expect(page2.total).toBe(5);

        // С‡С‚РѕР±С‹ СЃС‚СЂР°РЅРёС†С‹ РЅРµ СЃРѕРІРїР°Р»Рё
        expect(page1.requests[0]!.id).not.toBe(page2.requests[0]!.id);
    });

    it("listForAdmin supports order newest/oldest", async () => {
        const repo = createSubscriptionRequestsRepo(db);
        await repo.createPending({ id: "r1", tgUserId: "tg1", iin: "030512550111" });
        await new Promise((r) => setTimeout(r, 1000));
        await repo.createPending({ id: "r2", tgUserId: "tg2", iin: "030512550112" });
        await new Promise((r) => setTimeout(r, 1000));
        await repo.createPending({ id: "r3", tgUserId: "tg3", iin: "030512550113" });

        const oldest = await repo.listForAdmin({ limit: 10, order: "oldest", only: "new" });
        expect(oldest.requests.map((x) => x.id)).toEqual(["r1", "r2", "r3"]);

        const newest = await repo.listForAdmin({ limit: 10, order: "newest", only: "new" });
        expect(newest.requests.map((x) => x.id)).toEqual(["r3", "r2", "r1"]);
    });

    it("listForAdmin supports status filter including not_pending", async () => {
        const repo = createSubscriptionRequestsRepo(db);
        await repo.createPending({ id: "r_pending", tgUserId: "tg1", iin: "030512550111" });
        await repo.createPending({ id: "r_approved", tgUserId: "tg2", iin: "030512550112" });
        await repo.createPending({ id: "r_rejected", tgUserId: "tg3", iin: "030512550113" });

        await repo.updateStatus({
            id: "r_approved",
            status: "approved",
            reviewedAt: new Date(),
            reviewedBy: "admin-1"
        });
        await repo.updateStatus({
            id: "r_rejected",
            status: "rejected",
            reviewedAt: new Date(),
            reviewedBy: "admin-1"
        });

        const notPending = await repo.listForAdmin({ limit: 10, status: "not_pending", order: "oldest" });
        expect(notPending.requests.map((x) => x.id)).toEqual(["r_approved", "r_rejected"]);
        expect(notPending.total).toBe(2);

        const approved = await repo.listForAdmin({ limit: 10, status: "approved" });
        expect(approved.requests.map((x) => x.id)).toEqual(["r_approved"]);
        expect(approved.total).toBe(1);
    });

    it("listByTgUserId returns requests for selected parent with ordering", async () => {
        const repo = createSubscriptionRequestsRepo(db);
        await repo.createPending({ id: "r1", tgUserId: "tg1", iin: "030512550111" });
        await new Promise((r) => setTimeout(r, 1000));
        await repo.createPending({ id: "r2", tgUserId: "tg2", iin: "030512550112" });
        await new Promise((r) => setTimeout(r, 1000));
        await repo.createPending({ id: "r3", tgUserId: "tg1", iin: "030512550113" });

        const newest = await repo.listByTgUserId({ tgUserId: "tg1", limit: 10, order: "newest" });
        expect(newest.map((x) => x.id)).toEqual(["r3", "r1"]);

        const oldest = await repo.listByTgUserId({ tgUserId: "tg1", limit: 10, order: "oldest" });
        expect(oldest.map((x) => x.id)).toEqual(["r1", "r3"]);
    });
});


