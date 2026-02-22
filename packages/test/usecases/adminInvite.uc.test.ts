import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { adminInvites, admins, rolePermissions, roles } from "@school-gate/db/schema";
import { createAdminsRepo } from "@school-gate/infra/drizzle/repos/admins.repo";
import { createAdminInvitesRepo } from "@school-gate/infra/drizzle/repos/adminInvites.repo";
import { createRolesRepo } from "@school-gate/infra/drizzle/repos/roles.repo";
import { createArgon2PasswordHasher } from "@school-gate/infra/security/passwordHasher";
import { createTokenHasher } from "@school-gate/infra/security/tokenHasher";
import { createAdminsService } from "@school-gate/core/iam/services/admins.service";
import { createAdminInvitesService } from "@school-gate/core/iam/services/adminInvites.service";
import { createRolesService } from "@school-gate/core/iam/services/roles.service";
import { createCreateAdminInviteFlow } from "@school-gate/core/iam/flows/admin/createAdminInvite.flow";
import { createAcceptAdminInviteFlow } from "@school-gate/core/iam/flows/admin/acceptAdminInvite.flow";
import { createAdminLoginFlow } from "@school-gate/core/iam/flows/auth/adminLogin.flow";
import { createTestDb } from "../helpers/testDb.js";

describe("admin invites", () => {
    let db: ReturnType<typeof createTestDb>["db"];
    let cleanup: () => void;

    beforeAll(() => {
        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;
    });

    afterAll(() => cleanup());

    beforeEach(async () => {
        await db.delete(adminInvites);
        await db.delete(admins);
        await db.delete(rolePermissions);
        await db.delete(roles);
    });

    it("creates invite and accepts it", async () => {
        const rolesRepo = createRolesRepo(db);
        const adminsRepo = createAdminsRepo(db);
        const invitesRepo = createAdminInvitesRepo(db);
        const passwordHasher = createArgon2PasswordHasher();
        const tokenHasher = createTokenHasher();

        const clock = { now: () => new Date("2026-01-01T00:00:00.000Z") };
        const idGen = { nextId: () => `id-${Math.random().toString(36).slice(2)}` };

        const adminsService = createAdminsService({ adminsRepo });
        const rolesService = createRolesService({ rolesRepo, clock });
        const adminInvitesService = createAdminInvitesService({ adminInvitesRepo: invitesRepo });
        await rolesService.createRole({
            id: "role-manager",
            name: "manager",
            permissions: ["devices.read", "devices.write"],
        });

        await adminsRepo.create({
            id: "super-admin",
            email: "super@school.local",
            passwordHash: await passwordHasher.hash("SuperPassword!"),
            roleId: "role-manager",
            status: "active",
            name: "Super Admin",
            tgUserId: null,
            createdAt: clock.now(),
            updatedAt: clock.now(),
        });

        const createInvite = createCreateAdminInviteFlow({
            rolesService,
            adminInvitesService,
            tokenHasher,
            idGen,
            clock,
        });

        const invite = await createInvite({
            roleId: "role-manager",
            email: "Admin@Example.com",
            createdBy: "super-admin",
            expiresAt: new Date("2026-02-01T00:00:00.000Z"),
        });

        const acceptInvite = createAcceptAdminInviteFlow({
            adminInvitesService,
            adminsService,
            rolesService,
            passwordHasher,
            tokenHasher,
            idGen,
            clock,
        });

        const result = await acceptInvite({
            token: invite.token,
            email: "admin@example.com",
            password: "Password123!",
            name: "Admin",
        });

        expect(result.roleId).toBe("role-manager");
        const created = await adminsRepo.getById(result.adminId);
        expect(created?.email).toBe("admin@example.com");
        expect(created?.status).toBe("active");

        const login = createAdminLoginFlow({ adminsService, passwordHasher });
        const success = await login({ email: "admin@example.com", password: "Password123!" });
        expect(success?.admin.id).toBe(result.adminId);

        const wrong = await login({ email: "admin@example.com", password: "wrong" });
        expect(wrong).toBeNull();
    });
});

