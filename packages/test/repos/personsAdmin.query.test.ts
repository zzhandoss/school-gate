import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { personTerminalIdentities, persons } from "@school-gate/db/schema";
import { createPersonsAdminQuery } from "@school-gate/infra/drizzle/queries/personsAdmin.query";
import { createTestDb } from "../helpers/testDb.js";

describe("PersonsAdminQuery", () => {
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
        await db.delete(personTerminalIdentities);
        await db.delete(persons);
    });

    it("returns hasDeviceIdentities without N+1-style per-person lookups in feature code", async () => {
        await db.insert(persons).values([
            { id: "p-1", iin: "030512550123", firstName: "Aida", lastName: "Nur" },
            { id: "p-2", iin: "030512550124", firstName: "Ivan", lastName: "Petrov" }
        ]);
        await db.insert(personTerminalIdentities).values({
            id: "pti-1",
            personId: "p-1",
            deviceId: "dev-1",
            terminalPersonId: "T-1"
        });

        const query = createPersonsAdminQuery(db);
        const result = await query.list({ limit: 10, offset: 0 });

        expect(result.total).toBe(2);
        expect(result.persons).toMatchObject([
            { id: "p-1", hasDeviceIdentities: true },
            { id: "p-2", hasDeviceIdentities: false }
        ]);
    });

    it("applies linked status and include/exclude device filters", async () => {
        await db.insert(persons).values([
            { id: "p-1", iin: "030512550123" },
            { id: "p-2", iin: "030512550124" },
            { id: "p-3", iin: "030512550125" }
        ]);
        await db.insert(personTerminalIdentities).values([
            {
                id: "pti-1",
                personId: "p-1",
                deviceId: "dev-1",
                terminalPersonId: "T-1"
            },
            {
                id: "pti-2",
                personId: "p-2",
                deviceId: "dev-2",
                terminalPersonId: "T-2"
            }
        ]);

        const query = createPersonsAdminQuery(db);

        await expect(query.list({ limit: 10, offset: 0, linkedStatus: "linked" })).resolves.toMatchObject({
            total: 2,
            persons: [{ id: "p-1" }, { id: "p-2" }]
        });
        await expect(query.list({ limit: 10, offset: 0, linkedStatus: "unlinked" })).resolves.toMatchObject({
            total: 1,
            persons: [{ id: "p-3" }]
        });
        await expect(query.list({ limit: 10, offset: 0, includeDeviceIds: ["dev-1"] })).resolves.toMatchObject({
            total: 1,
            persons: [{ id: "p-1" }]
        });
        await expect(query.list({ limit: 10, offset: 0, excludeDeviceIds: ["dev-1"] })).resolves.toMatchObject({
            total: 2,
            persons: [{ id: "p-2" }, { id: "p-3" }]
        });
    });
});
