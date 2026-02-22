import { enqueueAuditRequested } from "../../../audit/events/auditRequested.js";
import { AdminNotFoundError } from "../../../utils/errors.js";
import type { CreateTelegramLinkCodeDeps, CreateTelegramLinkCodeFlow } from "./createTelegramLinkCode.types.js";

export function createCreateTelegramLinkCodeFlow(
    deps: CreateTelegramLinkCodeDeps
): CreateTelegramLinkCodeFlow {
    return async function createTelegramLinkCode(input) {
        const admin = await deps.adminsService.getById(input.adminId);
        if (!admin) {
            throw new AdminNotFoundError();
        }

        const code = deps.idGen.nextId();
        const codeHash = deps.tokenHasher.hash(code);
        const createdAt = deps.clock.now();

        await deps.adminTgCodesService.create({
            codeHash,
            adminId: admin.id,
            purpose: "link",
            expiresAt: input.expiresAt,
        });

        enqueueAuditRequested({
            outbox: deps.outbox,
            id: deps.idGen.nextId(),
            actorId: admin.id,
            action: "admin_telegram_link_code_created",
            entityType: "admin",
            entityId: admin.id,
            at: createdAt,
            meta: { expiresAt: input.expiresAt.toISOString() },
        });

        return { code, expiresAt: input.expiresAt };
    };
}