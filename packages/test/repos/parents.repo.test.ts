import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { parents } from "@school-gate/db/schema/index";
import { createParentsRepo } from "@school-gate/infra/drizzle/repos/parents.repo";

describe("ParentsRepo", () => {
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
        // чистим таблицу, чтобы тесты были независимыми
        await db.delete(parents);
    });

    it("upsert creates parent and getByTgUserId returns it", async () => {
        const repo = createParentsRepo(db);

        await repo.upsert({ tgUserId: "1001", chatId: "chat-1" });

        const p = await repo.getByTgUserId("1001");
        expect(p).not.toBeNull();
        expect(p!.tgUserId).toBe("1001");
        expect(p!.chatId).toBe("chat-1");
        expect(p!.createdAt).toBeInstanceOf(Date);
    });

    it("upsert updates chatId for existing tgUserId", async () => {
        const repo = createParentsRepo(db);

        await repo.upsert({ tgUserId: "1001", chatId: "chat-1" });
        await repo.upsert({ tgUserId: "1001", chatId: "chat-2" });

        const p = await repo.getByTgUserId("1001");
        expect(p!.chatId).toBe("chat-2");
    });

    it("getByTgUserId returns null when absent", async () => {
        const repo = createParentsRepo(db);

        const p = await repo.getByTgUserId("nope");
        expect(p).toBeNull();
    });
});

