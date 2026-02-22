import { enqueueAuditRequested } from "../../../audit/events/auditRequested.js";
import {
    PasswordResetExpiredError,
    PasswordResetNotFoundError,
    PasswordResetUsedError,
} from "../../../utils/errors.js";
import type { ConfirmPasswordResetDeps, ConfirmPasswordResetFlow } from "./confirmPasswordReset.types.js";

export function createConfirmPasswordResetFlow(deps: ConfirmPasswordResetDeps): ConfirmPasswordResetFlow {
    return async function confirmPasswordReset(input) {
        const tokenHash = deps.tokenHasher.hash(input.token);
        const reset = await deps.passwordResetsService.getByTokenHash(tokenHash);
        if (!reset) {
            throw new PasswordResetNotFoundError();
        }

        if (reset.usedAt) {
            throw new PasswordResetUsedError();
        }

        const now = deps.clock.now();
        if (reset.expiresAt.getTime() <= now.getTime()) {
            throw new PasswordResetExpiredError();
        }

        const passwordHash = await deps.passwordHasher.hash(input.password);
        await deps.adminsService.setPassword({
            adminId: reset.adminId,
            passwordHash,
            updatedAt: now,
        });

        await deps.passwordResetsService.markUsed({ tokenHash, usedAt: now });

        enqueueAuditRequested({
            outbox: deps.outbox,
            id: deps.idGen.nextId(),
            actorId: `admin:${reset.adminId}`,
            action: "password_reset_confirmed",
            entityType: "admin",
            entityId: reset.adminId,
            at: now,
            meta: { tokenHash },
        });

        return { adminId: reset.adminId };
    };
}