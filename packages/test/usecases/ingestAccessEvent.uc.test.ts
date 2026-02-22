import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { accessEvents, persons, personTerminalIdentities } from "@school-gate/db/schema/index";
import { createAccessEventsRepo } from "@school-gate/infra/drizzle/repos/accessEvents.repo";
import { createPersonsRepo } from "@school-gate/infra/drizzle/repos/persons.repo";
import { createPersonTerminalIdentitiesRepo } from "@school-gate/infra/drizzle/repos/personTerminalIdentities.repo";
import { createIngestAccessEventUC } from "@school-gate/core/usecases/ingestAccessEvent";

describe("IngestAccessEventUC", () => {
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
        await db.delete(personTerminalIdentities);
        await db.delete(persons);
    });

    it("creates person and mapping when iin is present", async () => {
        const accessEventsRepo = createAccessEventsRepo(db);
        const personsRepo = createPersonsRepo(db);
        const ptiRepo = createPersonTerminalIdentitiesRepo(db);

        const ids = ["person-1", "map-1", "event-1"];
        const idGen = { nextId: () => ids.shift()! };

        const inlineQueue = { enqueue: vi.fn() };
        const uc = createIngestAccessEventUC({
            accessEventsRepo,
            personsRepo,
            personTerminalIdentitiesRepo: ptiRepo,
            idGen,
            inlineQueue,
        });

        const now = new Date();
        const res = await uc({
            eventId: "ev-1",
            deviceId: "dev-1",
            direction: "IN",
            occurredAt: now,
            terminalPersonId: "T-1",
            iin: "030512550123",
        });

        expect(res.result).toBe("inserted");
        expect(res.status).toBe("NEW");
        expect(res.accessEventId).toBe("event-1");
        expect(inlineQueue.enqueue).toHaveBeenCalledWith("event-1");

        const person = await personsRepo.getByIin("030512550123");
        expect(person).not.toBeNull();

        const mapping = await ptiRepo.getByDeviceAndTerminalPersonId({
            deviceId: "dev-1",
            terminalPersonId: "T-1",
        });
        expect(mapping).not.toBeNull();
        expect(mapping!.personId).toBe(person!.id);

        const unmatched = await accessEventsRepo.listUnmatched({ limit: 10 });
        expect(unmatched).toHaveLength(0);
    });

    it("marks event as unmatched when no iin and no mapping", async () => {
        const accessEventsRepo = createAccessEventsRepo(db);
        const personsRepo = createPersonsRepo(db);
        const ptiRepo = createPersonTerminalIdentitiesRepo(db);

        const uc = createIngestAccessEventUC({
            accessEventsRepo,
            personsRepo,
            personTerminalIdentitiesRepo: ptiRepo,
            idGen: { nextId: () => "id-1" },
        });

        const res = await uc({
            eventId: "ev-2",
            deviceId: "dev-1",
            direction: "OUT",
            occurredAt: new Date(),
            terminalPersonId: "T-404",
        });

        expect(res.status).toBe("UNMATCHED");
        expect(res.accessEventId).toBe("id-1");

        const unmatched = await accessEventsRepo.listUnmatched({ limit: 10 });
        expect(unmatched).toHaveLength(1);
        expect(unmatched[0].terminalPersonId).toBe("T-404");
    });

    it("treats existing mapping as matched when iin is missing", async () => {
        const accessEventsRepo = createAccessEventsRepo(db);
        const personsRepo = createPersonsRepo(db);
        const ptiRepo = createPersonTerminalIdentitiesRepo(db);

        await personsRepo.create({ id: "p1", iin: "030512550123" });
        await ptiRepo.upsert({ id: "pti1", personId: "p1", deviceId: "dev-1", terminalPersonId: "T-1" });

        const uc = createIngestAccessEventUC({
            accessEventsRepo,
            personsRepo,
            personTerminalIdentitiesRepo: ptiRepo,
            idGen: { nextId: () => "id-1" },
        });

        const res = await uc({
            eventId: "ev-3",
            deviceId: "dev-1",
            direction: "IN",
            occurredAt: new Date(),
            terminalPersonId: "T-1",
        });

        expect(res.status).toBe("NEW");
        expect(res.accessEventId).toBe("id-1");

        const unmatched = await accessEventsRepo.listUnmatched({ limit: 10 });
        expect(unmatched).toHaveLength(0);
    });
});

