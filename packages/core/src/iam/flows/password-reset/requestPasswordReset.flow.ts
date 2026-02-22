import { enqueueAuditRequested } from "../../../audit/events/auditRequested.js";
import { normalizeEmail } from "../../../utils/normalizeEmail.js";
import type { RequestPasswordResetDeps, RequestPasswordResetFlow } from "./requestPasswordReset.types.js";

export function createRequestPasswordResetFlow(deps: RequestPasswordResetDeps): RequestPasswordResetFlow {
    return async function requestPasswordReset(input) {
        const email = normalizeEmail(input.email);
        const admin = await deps.adminsService.getByEmail(email);
        if (!admin) {
            return { token: null };
        }

        const token = deps.idGen.nextId();
        const tokenHash = deps.tokenHasher.hash(token);
        const createdAt = deps.clock.now();

        await deps.passwordResetsService.create({
            tokenHash,
            adminId: admin.id,
            expiresAt: input.expiresAt,
            usedAt: null,
            createdAt,
        });

        enqueueAuditRequested({
            outbox: deps.outbox,
            id: deps.idGen.nextId(),
            actorId: `admin:${admin.id}`,
            action: "password_reset_requested",
            entityType: "admin",
            entityId: admin.id,
            at: createdAt,
            meta: { expiresAt: input.expiresAt.toISOString() },
        });

        return { token };
    };
}