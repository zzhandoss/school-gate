import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { adminInvites, admins, adminTgCodes, passwordResets, rolePermissions, roles } from "@school-gate/db/schema";
import { createAdminsRepo } from "@school-gate/infra/drizzle/repos/admins.repo";
import { createAdminTgCodesRepo } from "@school-gate/infra/drizzle/repos/adminTgCodes.repo";
import { createPasswordResetsRepo } from "@school-gate/infra/drizzle/repos/passwordResets.repo";
import { createRolesRepo } from "@school-gate/infra/drizzle/repos/roles.repo";
import { createArgon2PasswordHasher } from "@school-gate/infra/security/passwordHasher";
import { createTokenHasher } from "@school-gate/infra/security/tokenHasher";
import { createAdminsService } from "@school-gate/core/iam/services/admins.service";
import { createAdminTgCodesService } from "@school-gate/core/iam/services/adminTgCodes.service";
import { createPasswordResetsService } from "@school-gate/core/iam/services/passwordResets.service";
import { createRolesService } from "@school-gate/core/iam/services/roles.service";
import { createRequestPasswordResetFlow } from "@school-gate/core/iam/flows/password-reset/requestPasswordReset.flow";
import { createConfirmPasswordResetFlow } from "@school-gate/core/iam/flows/password-reset/confirmPasswordReset.flow";
import { createCreateTelegramLinkCodeFlow } from "@school-gate/core/iam/flows/telegram/createTelegramLinkCode.flow";
import { createLinkTelegramByCodeFlow } from "@school-gate/core/iam/flows/telegram/linkTelegramByCode.flow";
import { createTestDb } from "../helpers/testDb.js";

describe("admin reset and telegram link", () => {
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
        await db.delete(adminTgCodes);
        await db.delete(passwordResets);
        await db.delete(admins);
        await db.delete(rolePermissions);
        await db.delete(roles);
    });

    it("resets password and links telegram", async () => {
        const rolesRepo = createRolesRepo(db);
        const adminsRepo = createAdminsRepo(db);
        const resetsRepo = createPasswordResetsRepo(db);
        const tgLinksRepo = createAdminTgCodesRepo(db);
        const passwordHasher = createArgon2PasswordHasher();
        const tokenHasher = createTokenHasher();
        const outbox = { enqueue: () => {} };

        const clock = { now: () => new Date("2026-01-01T00:00:00.000Z") };
        const idGen = { nextId: () => `id-${Math.random().toString(36).slice(2)}` };

        const adminsService = createAdminsService({ adminsRepo, passwordHasher });
        const rolesService = createRolesService({ rolesRepo, clock });
        const passwordResetsService = createPasswordResetsService({ passwordResetsRepo: resetsRepo });
        const adminTgCodesService = createAdminTgCodesService({ adminTgCodesRepo: tgLinksRepo });

        await rolesService.createRole({
            id: "role-manager",
            name: "manager",
            permissions: ["devices.read"],
        });

        const adminId = "admin-1";
        await adminsRepo.create({
            id: adminId,
            email: "admin@example.com",
            passwordHash: await passwordHasher.hash("OldPassword!"),
            roleId: "role-manager",
            status: "active",
            name: "Admin",
            tgUserId: null,
            createdAt: clock.now(),
            updatedAt: clock.now(),
        });

        const requestReset = createRequestPasswordResetFlow({
            adminsService,
            passwordResetsService,
            outbox,
            tokenHasher,
            idGen,
            clock,
        });

        const reset = await requestReset({
            email: "admin@example.com",
            expiresAt: new Date("2026-01-01T01:00:00.000Z"),
        });
        expect(reset.token).toBeTruthy();

        const confirmReset = createConfirmPasswordResetFlow({
            adminsService,
            passwordResetsService,
            passwordHasher,
            outbox,
            tokenHasher,
            idGen,
            clock,
        });

        await confirmReset({
            token: reset.token!,
            password: "NewPassword!",
        });

        const result = await adminsService.login({ email: "admin@example.com", password: "NewPassword!" });
        expect(result?.admin.id).toBe(adminId);

        const createLinkCode = createCreateTelegramLinkCodeFlow({
            adminsService,
            adminTgCodesService,
            outbox,
            tokenHasher,
            idGen,
            clock,
        });

        const linkCode = await createLinkCode({
            adminId,
            expiresAt: new Date("2026-01-01T00:05:00.000Z"),
        });

        const linkByCode = createLinkTelegramByCodeFlow({
            adminsService,
            adminTgCodesService,
            outbox,
            tokenHasher,
            idGen,
            clock,
        });

        await linkByCode({ code: linkCode.code, tgUserId: "tg-1" });
        const updated = await adminsRepo.getById(adminId);
        expect(updated?.tgUserId).toBe("tg-1");

        const secondCode = await createLinkCode({
            adminId,
            expiresAt: new Date("2026-01-01T00:06:00.000Z"),
        });

        await expect(linkByCode({ code: secondCode.code, tgUserId: "tg-1" })).resolves.toEqual({
            adminId,
        });
    });
});

