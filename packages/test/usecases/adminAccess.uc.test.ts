import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { admins, rolePermissions, roles } from "@school-gate/db/schema";
import { createAdminsRepo } from "@school-gate/infra/drizzle/repos/admins.repo";
import { createRolesRepo } from "@school-gate/infra/drizzle/repos/roles.repo";
import { createAdminsService } from "@school-gate/core/iam/services/admins.service";
import { createRolesService } from "@school-gate/core/iam/services/roles.service";
import { createGetAdminAccessFlow } from "@school-gate/core/iam/flows/access/getAdminAccess.flow";
import { AdminDisabledError, RoleNotFoundError } from "@school-gate/core/utils/errors";
import type { RolesRepo } from "@school-gate/core/iam/repos/roles.repo";
import { createTestDb } from "../helpers/testDb.js";

describe("getAdminAccess", () => {
    let db: ReturnType<typeof createTestDb>["db"];
    let cleanup: () => void;

    beforeAll(() => {
        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;
    });

    afterAll(() => cleanup());

    beforeEach(async () => {
        await db.delete(admins);
        await db.delete(rolePermissions);
        await db.delete(roles);
    });

    it("returns permissions for active admin", async () => {
        const adminsRepo = createAdminsRepo(db);
        const rolesRepo = createRolesRepo(db);
        const now = new Date("2026-01-01T00:00:00.000Z");
        const clock = { now: () => now };

        await rolesRepo.upsert({ id: "r1", name: "manager", createdAt: now, updatedAt: now });
        await rolesRepo.replacePermissions({ roleId: "r1", permissions: ["devices.read"] });

        await adminsRepo.create({
            id: "a1",
            email: "admin@example.com",
            passwordHash: "hash",
            roleId: "r1",
            status: "active",
            name: null,
            tgUserId: null,
            createdAt: now,
            updatedAt: now
        });

        const adminsService = createAdminsService({ adminsRepo });
        const rolesService = createRolesService({ rolesRepo, clock });
        const getAccess = createGetAdminAccessFlow({ adminsService, rolesService });
        const access = await getAccess("a1");

        expect(access.permissions).toEqual(["devices.read"]);
    });

    it("throws if admin is disabled", async () => {
        const adminsRepo = createAdminsRepo(db);
        const rolesRepo = createRolesRepo(db);
        const now = new Date("2026-01-01T00:00:00.000Z");
        const clock = { now: () => now };

        await rolesRepo.upsert({ id: "r1", name: "manager", createdAt: now, updatedAt: now });
        await rolesRepo.replacePermissions({ roleId: "r1", permissions: ["devices.read"] });

        await adminsRepo.create({
            id: "a1",
            email: "admin@example.com",
            passwordHash: "hash",
            roleId: "r1",
            status: "disabled",
            name: null,
            tgUserId: null,
            createdAt: now,
            updatedAt: now
        });

        const adminsService = createAdminsService({ adminsRepo });
        const rolesService = createRolesService({ rolesRepo, clock });
        const getAccess = createGetAdminAccessFlow({ adminsService, rolesService });
        await expect(getAccess("a1")).rejects.toBeInstanceOf(AdminDisabledError);
    });

    it("throws if role missing", async () => {
        const adminsRepo = createAdminsRepo(db);
        const rolesRepo = createRolesRepo(db);
        const now = new Date("2026-01-01T00:00:00.000Z");
        const clock = { now: () => now };

        await rolesRepo.upsert({ id: "r1", name: "manager", createdAt: now, updatedAt: now });

        await adminsRepo.create({
            id: "a1",
            email: "admin@example.com",
            passwordHash: "hash",
            roleId: "r1",
            status: "active",
            name: null,
            tgUserId: null,
            createdAt: now,
            updatedAt: now
        });

        const missingRolesRepo: RolesRepo = {
            upsert: async () => {},
            getById: async () => null,
            getByName: async () => null,
            list: async () => [],
            listPermissions: async () => [],
            replacePermissions: async () => {},
            withTx: () => missingRolesRepo
        };

        const adminsService = createAdminsService({ adminsRepo });
        const rolesService = createRolesService({ rolesRepo: missingRolesRepo, clock });
        const getAccess = createGetAdminAccessFlow({ adminsService, rolesService });
        await expect(getAccess("a1")).rejects.toBeInstanceOf(RoleNotFoundError);
    });
});

