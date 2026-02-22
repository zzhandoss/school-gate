import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { createPersonsRepo } from "@school-gate/infra/drizzle/repos/persons.repo";
import { persons } from "@school-gate/db/schema/index";

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
        await db.delete(persons);
    });

    it("create + getByIin", async () => {
        const repo = createPersonsRepo(db);

        await repo.create({
            id: "p1",
            iin: "030512550123",
            firstName: "Alihan",
            lastName: "Erzhanov",
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
            terminalPersonId: "T-777",
        });

        const p = await repo.getByTerminalPersonId("T-777");
        expect(p).not.toBeNull();
        expect(p!.iin).toBe("030512550123");
    });

    it("updateById updates names and terminalPersonId", async () => {
        const repo = createPersonsRepo(db);

        await repo.create({
            id: "p1",
            iin: "030512550123",
        });

        await repo.updateById({
            id: "p1",
            firstName: "A",
            lastName: "B",
            terminalPersonId: "T-1",
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
});

