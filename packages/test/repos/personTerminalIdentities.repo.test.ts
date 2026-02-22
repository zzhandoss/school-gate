import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { persons, personTerminalIdentities } from "@school-gate/db/schema/index";
import { createPersonsRepo } from "@school-gate/infra/drizzle/repos/persons.repo";
import { createPersonTerminalIdentitiesRepo } from "@school-gate/infra/drizzle/repos/personTerminalIdentities.repo";

describe("PersonTerminalIdentitiesRepo", () => {
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

    it("upsert + getByPersonAndDevice works", async () => {
        const personsRepo = createPersonsRepo(db);
        const repo = createPersonTerminalIdentitiesRepo(db);

        await personsRepo.create({ id: "p1", iin: "030512550123" });

        await repo.upsert({ id: "pti1", personId: "p1", deviceId: "dev1", terminalPersonId: "T-100" });

        const x = await repo.getByPersonAndDevice({ personId: "p1", deviceId: "dev1" });
        expect(x).not.toBeNull();
        expect(x!.terminalPersonId).toBe("T-100");
    });

    it("upsert updates terminalPersonId for the same (personId, deviceId)", async () => {
        const personsRepo = createPersonsRepo(db);
        const repo = createPersonTerminalIdentitiesRepo(db);

        await personsRepo.create({ id: "p1", iin: "030512550123" });

        await repo.upsert({ id: "pti1", personId: "p1", deviceId: "dev1", terminalPersonId: "T-100" });
        await repo.upsert({ id: "pti2", personId: "p1", deviceId: "dev1", terminalPersonId: "T-200" });

        const x = await repo.getByPersonAndDevice({ personId: "p1", deviceId: "dev1" });
        expect(x!.terminalPersonId).toBe("T-200");
    });

    it("getByDeviceAndTerminalPersonId works", async () => {
        const personsRepo = createPersonsRepo(db);
        const repo = createPersonTerminalIdentitiesRepo(db);

        await personsRepo.create({ id: "p1", iin: "030512550123" });

        await repo.upsert({ id: "pti1", personId: "p1", deviceId: "dev1", terminalPersonId: "T-777" });

        const x = await repo.getByDeviceAndTerminalPersonId({ deviceId: "dev1", terminalPersonId: "T-777" });
        expect(x).not.toBeNull();
        expect(x!.personId).toBe("p1");
    });

    it("terminalPersonId is unique inside the same device", async () => {
        const personsRepo = createPersonsRepo(db);
        const repo = createPersonTerminalIdentitiesRepo(db);

        await personsRepo.create({ id: "p1", iin: "030512550123" });
        await personsRepo.create({ id: "p2", iin: "040512550123" });

        await repo.upsert({ id: "pti1", personId: "p1", deviceId: "dev1", terminalPersonId: "T-1" });

        await expect(
            repo.upsert({ id: "pti2", personId: "p2", deviceId: "dev1", terminalPersonId: "T-1" })
        ).rejects.toBeTruthy();
    });

    it("listByPersonId returns all mappings", async () => {
        const personsRepo = createPersonsRepo(db);
        const repo = createPersonTerminalIdentitiesRepo(db);

        await personsRepo.create({ id: "p1", iin: "030512550123" });

        await repo.upsert({ id: "pti1", personId: "p1", deviceId: "dev1", terminalPersonId: "T-1" });
        await repo.upsert({ id: "pti2", personId: "p1", deviceId: "dev2", terminalPersonId: "T-1" });

        const list = await repo.listByPersonId({ personId: "p1" });
        expect(list).toHaveLength(2);
        const devs = list.map((x) => x.deviceId);
        expect(devs).toContain("dev1");
        expect(devs).toContain("dev2");
    });
});

