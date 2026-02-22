import { enqueueAuditRequested } from "../../../audit/events/auditRequested.js";
import {
    AdminTgAlreadyLinkedError,
    AdminTgLinkExpiredError,
    AdminTgLinkNotFoundError,
    AdminTgLinkUsedError,
    AdminTgCodePurposeMismatchError,
} from "../../../utils/errors.js";
import type { LinkTelegramByCodeDeps, LinkTelegramByCodeFlow } from "./linkTelegramByCode.types.js";

export function createLinkTelegramByCodeFlow(deps: LinkTelegramByCodeDeps): LinkTelegramByCodeFlow {
    return async function linkTelegramByCode(input) {
        const codeHash = deps.tokenHasher.hash(input.code);
        const link = await deps.adminTgCodesService.getByCodeHash(codeHash);
        if (!link) throw new AdminTgLinkNotFoundError();

        if (link.purpose !== "link") {
            throw new AdminTgCodePurposeMismatchError();
        }

        if (link.usedAt) throw new AdminTgLinkUsedError();

        const now = deps.clock.now();
        if (link.expiresAt.getTime() <= now.getTime()) throw new AdminTgLinkExpiredError();

        const admin = await deps.adminsService.getById(link.adminId);
        if (!admin) throw new AdminTgLinkNotFoundError();

        if (admin.tgUserId && admin.tgUserId !== input.tgUserId) {
            throw new AdminTgAlreadyLinkedError();
        }

        await deps.adminsService.setTgUserId({
            adminId: admin.id,
            tgUserId: input.tgUserId,
            updatedAt: now,
        });

        await deps.adminTgCodesService.markUsed({ codeHash, usedAt: now });

        enqueueAuditRequested({
            outbox: deps.outbox,
            id: deps.idGen.nextId(),
            actorId: admin.id,
            action: "admin_telegram_linked",
            entityType: "admin",
            entityId: admin.id,
            at: now,
            meta: { tgUserId: input.tgUserId },
        });

        return { adminId: admin.id };
    };
}