import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { accessEvents, persons, personTerminalIdentities } from "@school-gate/db/schema/index";
import { createAccessEventsRepo } from "@school-gate/infra/drizzle/repos/accessEvents.repo";
import { createPersonsRepo } from "@school-gate/infra/drizzle/repos/persons.repo";
import { createPersonTerminalIdentitiesRepo } from "@school-gate/infra/drizzle/repos/personTerminalIdentities.repo";
import { createMapPersonTerminalIdentityUC } from "@school-gate/core/usecases/mapPersonTerminalIdentity";
import { PersonNotFoundError, TerminalIdentityAlreadyMappedError } from "@school-gate/core/utils/errors";

describe("MapPersonTerminalIdentityUC", () => {
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

    it("throws PersonNotFoundError for missing person", async () => {
        const uc = createMapPersonTerminalIdentityUC({
            personsRepo: createPersonsRepo(db),
            personTerminalIdentitiesRepo: createPersonTerminalIdentitiesRepo(db),
            accessEventsRepo: createAccessEventsRepo(db),
            idGen: { nextId: () => "x" }
        });

        await expect(
            uc({ personId: "p-missing", deviceId: "dev-1", terminalPersonId: "T-1" })
        ).rejects.toBeInstanceOf(PersonNotFoundError);
    });

    it("throws TerminalIdentityAlreadyMappedError on conflict", async () => {
        const personsRepo = createPersonsRepo(db);
        const ptiRepo = createPersonTerminalIdentitiesRepo(db);

        await personsRepo.create({ id: "p1", iin: "030512550123" });
        await personsRepo.create({ id: "p2", iin: "040512550123" });
        await ptiRepo.upsert({ id: "pti1", personId: "p1", deviceId: "dev-1", terminalPersonId: "T-1" });

        const uc = createMapPersonTerminalIdentityUC({
            personsRepo,
            personTerminalIdentitiesRepo: ptiRepo,
            accessEventsRepo: createAccessEventsRepo(db),
            idGen: { nextId: () => "x" }
        });

        await expect(
            uc({ personId: "p2", deviceId: "dev-1", terminalPersonId: "T-1" })
        ).rejects.toBeInstanceOf(TerminalIdentityAlreadyMappedError);
    });

    it("links identity and requeues unmatched events", async () => {
        const personsRepo = createPersonsRepo(db);
        const ptiRepo = createPersonTerminalIdentitiesRepo(db);
        const accessEventsRepo = createAccessEventsRepo(db);

        await personsRepo.create({ id: "p1", iin: "030512550123" });

        await accessEventsRepo.insertIdempotent({
            id: "e1",
            deviceId: "dev-1",
            direction: "IN",
            occurredAt: new Date(),
            terminalPersonId: "T-1",
            idempotencyKey: "k1",
            status: "UNMATCHED"
        });

        const uc = createMapPersonTerminalIdentityUC({
            personsRepo,
            personTerminalIdentitiesRepo: ptiRepo,
            accessEventsRepo,
            idGen: { nextId: () => "pti-new" }
        });

        const res = await uc({ personId: "p1", deviceId: "dev-1", terminalPersonId: "T-1" });
        expect(res.status).toBe("linked");
        expect(res.updatedEvents).toBe(1);

        const unmatched = await accessEventsRepo.listUnmatched({ limit: 10 });
        expect(unmatched).toHaveLength(0);
    });
});

