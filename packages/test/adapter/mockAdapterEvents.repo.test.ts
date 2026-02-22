import { afterEach, describe, expect, it } from "vitest";
import { createAdapterDb } from "../../../apps/adapters/mock/src/db.js";
import { createAdapterEventsRepo } from "../../../apps/adapters/mock/src/eventsRepo.js";

function createRepo() {
    const db = createAdapterDb(":memory:");
    const repo = createAdapterEventsRepo(db.db);
    return { db, repo };
}

describe("mock adapter events repo", () => {
    let db: ReturnType<typeof createAdapterDb> | null = null;

    afterEach(() => {
        if (db) {
            db.close();
            db = null;
        }
    });

    it("lists backfill events after cursor", () => {
        const setup = createRepo();
        db = setup.db;
        const repo = setup.repo;

        repo.insert({ eventId: "e1", deviceId: "d1", direction: "IN", occurredAt: 1 });
        repo.insert({ eventId: "e2", deviceId: "d1", direction: "IN", occurredAt: 2 });
        repo.insert({ eventId: "e3", deviceId: "d1", direction: "IN", occurredAt: 3 });

        const afterE1 = repo.listBackfill("d1", "e1", 10).map((event) => event.eventId);
        expect(afterE1).toEqual(["e2", "e3"]);

        const fromStart = repo.listBackfill("d1", "missing", 2).map((event) => event.eventId);
        expect(fromStart).toEqual(["e1", "e2"]);
    });

    it("filters unsent events by device", () => {
        const setup = createRepo();
        db = setup.db;
        const repo = setup.repo;

        repo.insert({ eventId: "e1", deviceId: "d1", direction: "IN", occurredAt: 1 });
        repo.insert({ eventId: "e2", deviceId: "d2", direction: "OUT", occurredAt: 2 });
        repo.insert({ eventId: "e3", deviceId: "d1", direction: "IN", occurredAt: 3 });

        const onlyD1 = repo.listUnsentForDevices(["d1"], 10).map((event) => event.eventId);
        expect(onlyD1).toEqual(["e1", "e3"]);
    });

    it("marks sent events and cleans up by retention", () => {
        const setup = createRepo();
        db = setup.db;
        const repo = setup.repo;

        repo.insert({ eventId: "e1", deviceId: "d1", direction: "IN", occurredAt: 10 });
        repo.insert({ eventId: "e2", deviceId: "d1", direction: "IN", occurredAt: 20 });

        repo.markSent(["e1"], 100);
        const pending = repo.listUnsent(10).map((event) => event.eventId);
        expect(pending).toEqual(["e2"]);

        const cleanup = repo.deleteOlderThan(15);
        expect(cleanup.deleted).toBe(1);
        const remaining = repo.listBackfill("d1", null, 10).map((event) => event.eventId);
        expect(remaining).toEqual(["e2"]);
    });
});
