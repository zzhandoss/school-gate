import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { createPersonsRepo } from "@school-gate/infra/drizzle/repos/persons.repo";
import { personTerminalIdentities, persons } from "@school-gate/db/schema/index";

describe("PersonsRepo", () => {
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
        await db.delete(persons);
    });

    it("create + getByIin", async () => {
        const repo = createPersonsRepo(db);

        await repo.create({
            id: "p1",
            iin: "030512550123",
            firstName: "Alihan",
            lastName: "Erzhanov"
        });

        const p = await repo.getByIin("030512550123");
        expect(p).not.toBeNull();
        expect(p!.id).toBe("p1");
        expect(p!.firstName).toBe("Alihan");
        expect(p!.terminalPersonId).toBeNull();
    });

    it("getByTerminalPersonId", async () => {
        const repo = createPersonsRepo(db);

        await repo.create({
            id: "p1",
            iin: "030512550123",
            terminalPersonId: "T-777"
        });

        const p = await repo.getByTerminalPersonId("T-777");
        expect(p).not.toBeNull();
        expect(p!.iin).toBe("030512550123");
    });

    it("updateById updates names and terminalPersonId", async () => {
        const repo = createPersonsRepo(db);

        await repo.create({
            id: "p1",
            iin: "030512550123"
        });

        await repo.updateById({
            id: "p1",
            firstName: "A",
            lastName: "B",
            terminalPersonId: "T-1"
        });

        const p = await repo.getByIin("030512550123");
        expect(p!.firstName).toBe("A");
        expect(p!.lastName).toBe("B");
        expect(p!.terminalPersonId).toBe("T-1");
    });

    it("unique iin constraint", async () => {
        const repo = createPersonsRepo(db);

        await repo.create({ id: "p1", iin: "030512550123" });

        await expect(repo.create({ id: "p2", iin: "030512550123" })).rejects.toThrow(
            "PERSON_UNIQUE_CONSTRAINT"
        );
    });

    it("filters linked and unlinked persons", async () => {
        const repo = createPersonsRepo(db);

        await repo.create({ id: "p1", iin: "030512550123" });
        await repo.create({ id: "p2", iin: "030512550124" });
        await db.insert(personTerminalIdentities).values({
            id: "pti-1",
            personId: "p1",
            deviceId: "dev-1",
            terminalPersonId: "T-1"
        });

        await expect(repo.list({ limit: 10, offset: 0, linkedStatus: "linked" })).resolves.toMatchObject([
            { id: "p1" }
        ]);
        await expect(repo.list({ limit: 10, offset: 0, linkedStatus: "unlinked" })).resolves.toMatchObject([
            { id: "p2" }
        ]);
        await expect(repo.count({ linkedStatus: "linked" })).resolves.toBe(1);
        await expect(repo.count({ linkedStatus: "unlinked" })).resolves.toBe(1);
    });

    it("filters persons by include/exclude linked devices", async () => {
        const repo = createPersonsRepo(db);

        await repo.create({ id: "p1", iin: "030512550123" });
        await repo.create({ id: "p2", iin: "030512550124" });
        await repo.create({ id: "p3", iin: "030512550125" });
        await db.insert(personTerminalIdentities).values([
            {
                id: "pti-1",
                personId: "p1",
                deviceId: "dev-1",
                terminalPersonId: "T-1"
            },
            {
                id: "pti-2",
                personId: "p2",
                deviceId: "dev-2",
                terminalPersonId: "T-2"
            },
            {
                id: "pti-3",
                personId: "p3",
                deviceId: "dev-1",
                terminalPersonId: "T-3"
            }
        ]);

        await expect(repo.list({ limit: 10, offset: 0, includeDeviceIds: ["dev-2"] })).resolves.toMatchObject([
            { id: "p2" }
        ]);
        await expect(repo.count({ includeDeviceIds: ["dev-1"] })).resolves.toBe(2);
        await expect(repo.list({ limit: 10, offset: 0, excludeDeviceIds: ["dev-1"] })).resolves.toMatchObject([
            { id: "p2" }
        ]);

        const includedWithoutExcluded = await repo.list({
            limit: 10,
            offset: 0,
            includeDeviceIds: ["dev-1", "dev-2"],
            excludeDeviceIds: ["dev-2"]
        });
        expect(includedWithoutExcluded.map((person) => person.id).sort()).toEqual(["p1", "p3"]);
    });
});

