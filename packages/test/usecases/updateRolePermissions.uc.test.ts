import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { rolePermissions, roles } from "@school-gate/db/schema";
import { createRolesRepo } from "@school-gate/infra/drizzle/repos/roles.repo";
import { createRolesService } from "@school-gate/core/iam/services/roles.service";
import { RoleNotFoundError } from "@school-gate/core/utils/errors";
import { createTestDb } from "../helpers/testDb.js";

describe("updateRolePermissions", () => {
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

    it("replaces permissions for existing role", async () => {
        const rolesRepo = createRolesRepo(db);
        const now = new Date("2026-01-01T00:00:00.000Z");
        const clock = { now: () => now };
        await rolesRepo.upsert({ id: "r1", name: "manager", createdAt: now, updatedAt: now });
        await rolesRepo.replacePermissions({ roleId: "r1", permissions: ["devices.read"] });

        const rolesService = createRolesService({ rolesRepo, clock });
        const updateRole = rolesService.updateRolePermissions;
        await updateRole({ roleId: "r1", permissions: ["devices.read", "devices.write"] });

        const perms = await rolesRepo.listPermissions("r1");
        expect(perms).toHaveLength(2);
    });

    it("throws when role missing", async () => {
        const rolesRepo = createRolesRepo(db);
        const now = new Date();
        const clock = { now: () => now };

        const rolesService = createRolesService({ rolesRepo, clock });
        const updateRole = rolesService.updateRolePermissions;

        await expect(
            updateRole({ roleId: "missing", permissions: ["devices.read"] })
        ).rejects.toBeInstanceOf(RoleNotFoundError);
    });
});

