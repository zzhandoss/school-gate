import { enqueueAuditRequested } from "../../../audit/events/auditRequested.js";
import { normalizeEmail } from "../../../utils/normalizeEmail.js";
import {
    AdminEmailAlreadyExistsError,
    AdminInviteEmailMismatchError,
    AdminInviteExpiredError,
    AdminInviteNotFoundError,
    AdminInviteUsedError,
    RoleNotFoundError
} from "../../../utils/errors.js";
import type { AcceptAdminInviteDeps, AcceptAdminInviteFlow } from "./acceptAdminInvite.types.js";

export function createAcceptAdminInviteFlow(deps: AcceptAdminInviteDeps): AcceptAdminInviteFlow {
    return async function acceptAdminInvite(input) {
        const tokenHash = deps.tokenHasher.hash(input.token);
        const invite = await deps.adminInvitesService.getByTokenHash(tokenHash);
        if (!invite) {
            throw new AdminInviteNotFoundError();
        }

        if (invite.usedAt) {
            throw new AdminInviteUsedError();
        }

        const now = deps.clock.now();
        if (invite.expiresAt.getTime() <= now.getTime()) {
            throw new AdminInviteExpiredError();
        }

        const email = normalizeEmail(input.email);
        if (invite.email && invite.email !== email) {
            throw new AdminInviteEmailMismatchError();
        }

        const existing = await deps.adminsService.getByEmail(email);
        if (existing) {
            throw new AdminEmailAlreadyExistsError();
        }

        const role = await deps.rolesService.getById(invite.roleId);
        if (!role) {
            throw new RoleNotFoundError();
        }

        const passwordHash = await deps.passwordHasher.hash(input.password);
        const adminId = deps.idGen.nextId();

        await deps.adminsService.create({
            id: adminId,
            email,
            passwordHash,
            roleId: invite.roleId,
            status: "active",
            name: input.name ?? null,
            tgUserId: null,
            createdAt: now,
            updatedAt: now
        });

        await deps.adminInvitesService.markUsed({ tokenHash, usedAt: now });

        enqueueAuditRequested({
            outbox: deps.outbox,
            id: deps.idGen.nextId(),
            actorId: `admin:${adminId}`,
            action: "admin_invite_accepted",
            entityType: "admin_invite",
            entityId: tokenHash,
            at: now,
            meta: { adminId, roleId: invite.roleId, email }
        });

        return { adminId, roleId: invite.roleId };
    };
}