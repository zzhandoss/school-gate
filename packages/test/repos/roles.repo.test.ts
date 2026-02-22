import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { rolePermissions, roles } from "@school-gate/db/schema";
import { createRolesRepo } from "@school-gate/infra/drizzle/repos/roles.repo";
import { createTestDb } from "../helpers/testDb.js";

describe("RolesRepo", () => {
    let db: ReturnType<typeof createTestDb>["db"];
    let cleanup: () => void;

    beforeAll(() => {
        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;
    });

    afterAll(() => cleanup());

    beforeEach(async () => {
        await db.delete(rolePermissions);
        await db.delete(roles);
    });

    it("upserts role and replaces permissions", async () => {
        const repo = createRolesRepo(db);
        const now = new Date("2026-01-01T00:00:00.000Z");

        await repo.upsert({ id: "r1", name: "manager", createdAt: now, updatedAt: now });
        await repo.replacePermissions({ roleId: "r1", permissions: ["devices.read", "devices.write"] });

        const role = await repo.getById("r1");
        expect(role?.name).toBe("manager");

        const perms = await repo.listPermissions("r1");
        expect(perms).toHaveLength(2);
        expect(perms).toContain("devices.read");
        expect(perms).toContain("devices.write");
    });
});

