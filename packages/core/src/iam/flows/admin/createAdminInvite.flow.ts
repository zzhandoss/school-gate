import { enqueueAuditRequested } from "../../../audit/events/auditRequested.js";
import { normalizeEmail } from "../../../utils/normalizeEmail.js";
import { RoleNotFoundError } from "../../../utils/errors.js";
import type { CreateAdminInviteDeps, CreateAdminInviteFlow } from "./createAdminInvite.types.js";

export function createCreateAdminInviteFlow(deps: CreateAdminInviteDeps): CreateAdminInviteFlow {
    return async function createAdminInvite(input) {
        const role = await deps.rolesService.getById(input.roleId);
        if (!role) {
            throw new RoleNotFoundError();
        }

        const token = deps.idGen.nextId();
        const tokenHash = deps.tokenHasher.hash(token);
        const email = input.email ? normalizeEmail(input.email) : null;
        const now = deps.clock.now();

        await deps.adminInvitesService.create({
            tokenHash,
            roleId: input.roleId,
            email,
            createdBy: input.createdBy,
            expiresAt: input.expiresAt,
            usedAt: null,
            createdAt: now,
        });

        enqueueAuditRequested({
            outbox: deps.outbox,
            id: deps.idGen.nextId(),
            actorId: input.createdBy,
            action: "admin_invite_created",
            entityType: "admin_invite",
            entityId: tokenHash,
            at: now,
            meta: { roleId: input.roleId, email, expiresAt: input.expiresAt.toISOString() },
        });

        return { token, tokenHash, roleId: input.roleId, email, expiresAt: input.expiresAt };
    };
}