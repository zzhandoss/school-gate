import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { parents, subscriptionRequests } from "@school-gate/db/schema/index";
import { createParentsRepo } from "@school-gate/infra/drizzle/repos/parents.repo";
import { createSubscriptionRequestsRepo } from "@school-gate/infra/drizzle/repos/subscriptionRequests.repo";
import { createRequestSubscriptionUC } from "@school-gate/core/usecases/requestSubscription";
import { InvalidIinError, PendingRequestAlreadyExistsError } from "@school-gate/core/utils/errors";



describe("RequestSubscriptionUC", () => {
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
        await db.delete(parents);
    });

    it("creates pending request and upserts parent", async () => {
        const parentsRepo = createParentsRepo(db);
        const subscriptionRequestsRepo = createSubscriptionRequestsRepo(db);

        const idGen = { nextId: () => "req-1" };

        const uc = createRequestSubscriptionUC({ parentsRepo, subscriptionRequestsRepo, idGen });

        const res = await uc({
            tgUserId: "tg1",
            chatId: "chat-1",
            iin: "030512550123",
        });

        expect(res).toEqual({ requestId: "req-1", status: "pending", iin: "030512550123" });

        const p = await parentsRepo.getByTgUserId("tg1");
        expect(p).not.toBeNull();
        expect(p!.chatId).toBe("chat-1");

        const req = await subscriptionRequestsRepo.getById("req-1");
        expect(req).not.toBeNull();
        expect(req!.status).toBe("pending");
    });

    it("throws InvalidIinError for invalid iin", async () => {
        const parentsRepo = createParentsRepo(db);
        const subscriptionRequestsRepo = createSubscriptionRequestsRepo(db);

        const idGen = { nextId: () => "req-1" };
        const uc = createRequestSubscriptionUC({ parentsRepo, subscriptionRequestsRepo, idGen });

        await expect(
            uc({ tgUserId: "tg1", chatId: "chat-1", iin: "abc" })
        ).rejects.toBeInstanceOf(InvalidIinError);

        // ничего не создалось
        const p = await parentsRepo.getByTgUserId("tg1");
        expect(p).toBeNull();
    });

    it("throws PendingRequestAlreadyExistsError when pending already exists", async () => {
        const parentsRepo = createParentsRepo(db);
        const subscriptionRequestsRepo = createSubscriptionRequestsRepo(db);

        const idGen = { nextId: () => "req-1" };
        const uc = createRequestSubscriptionUC({ parentsRepo, subscriptionRequestsRepo, idGen });

        await uc({ tgUserId: "tg1", chatId: "chat-1", iin: "030512550123" });

        await expect(
            uc({ tgUserId: "tg1", chatId: "chat-1", iin: "030512550123" })
        ).rejects.toBeInstanceOf(PendingRequestAlreadyExistsError);
    });
});

