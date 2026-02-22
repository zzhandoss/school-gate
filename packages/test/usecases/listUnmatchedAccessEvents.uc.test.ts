import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { accessEvents } from "@school-gate/db/schema/index";
import { createAccessEventsRepo } from "@school-gate/infra/drizzle/repos/accessEvents.repo";
import { createListUnmatchedAccessEventsUC } from "@school-gate/core/usecases/listUnmatchedAccessEvents";

describe("ListUnmatchedAccessEventsUC", () => {
    let db: ReturnType<typeof createTestDb>["db"];
    let cleanup: () => void;

    beforeAll(() => {
        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;
    });

    afterAll(() => cleanup());

    beforeEach(async () => {
        await db.delete(accessEvents);
    });

    it("returns unmatched events up to the limit", async () => {
        const accessEventsRepo = createAccessEventsRepo(db);
        await accessEventsRepo.insertIdempotent({
            id: "e1",
            deviceId: "dev-1",
            direction: "IN",
            occurredAt: new Date(),
            idempotencyKey: "k1",
            status: "UNMATCHED"
        });

        const uc = createListUnmatchedAccessEventsUC({ accessEventsRepo });
        const res = await uc({ limit: 10 });

        expect(res).toHaveLength(1);
        expect(res[0].status).toBe("UNMATCHED");
    });
});

