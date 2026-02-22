import { enqueueAuditRequested } from "../../../audit/events/auditRequested.js";
import { AdminNotFoundError } from "../../../utils/errors.js";
import type {
    CreateAdminPasswordResetLinkDeps,
    CreateAdminPasswordResetLinkFlow
} from "./createAdminPasswordResetLink.types.js";

export function createCreateAdminPasswordResetLinkFlow(
    deps: CreateAdminPasswordResetLinkDeps
): CreateAdminPasswordResetLinkFlow {
    return async function createAdminPasswordResetLink(input) {
        const admin = await deps.adminsService.getById(input.adminId);
        if (!admin) {
            throw new AdminNotFoundError();
        }

        const token = deps.idGen.nextId();
        const tokenHash = deps.tokenHasher.hash(token);
        const createdAt = deps.clock.now();

        await deps.passwordResetsService.create({
            tokenHash,
            adminId: admin.id,
            expiresAt: input.expiresAt,
            usedAt: null,
            createdAt
        });

        enqueueAuditRequested({
            outbox: deps.outbox,
            id: deps.idGen.nextId(),
            actorId: input.requestedByAdminId ?? "system:password_reset_admin",
            action: "admin_password_reset_link_created",
            entityType: "admin",
            entityId: admin.id,
            at: createdAt,
            meta: { expiresAt: input.expiresAt.toISOString() }
        });

        return { token, expiresAt: input.expiresAt };
    };
}