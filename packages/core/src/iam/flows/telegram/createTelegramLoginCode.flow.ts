import { randomInt } from "node:crypto";
import { enqueueAuditRequested } from "../../../audit/events/auditRequested.js";
import { AdminDisabledError, AdminNotFoundError, AdminTelegramNotLinkedError } from "../../../utils/errors.js";
import type { CreateTelegramLoginCodeDeps, CreateTelegramLoginCodeFlow } from "./createTelegramLoginCode.types.js";

export function createCreateTelegramLoginCodeFlow(
    deps: CreateTelegramLoginCodeDeps
): CreateTelegramLoginCodeFlow {
    return async function createTelegramLoginCode(input) {
        const admin = await deps.adminsService.getById(input.adminId);
        if (!admin) {
            throw new AdminNotFoundError();
        }

        if (!admin.tgUserId) {
            throw new AdminTelegramNotLinkedError();
        }

        if (admin.status !== "active") {
            throw new AdminDisabledError();
        }

        const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
        const codeHash = deps.tokenHasher.hash(code);
        const createdAt = deps.clock.now();

        await deps.adminTgCodesService.create({
            codeHash,
            adminId: admin.id,
            purpose: "login",
            expiresAt: input.expiresAt
        });

        enqueueAuditRequested({
            outbox: deps.outbox,
            id: deps.idGen.nextId(),
            actorId: admin.id,
            action: "admin_telegram_login_code_created",
            entityType: "admin",
            entityId: admin.id,
            at: createdAt,
            meta: { expiresAt: input.expiresAt.toISOString(), tgUserId: admin.tgUserId }
        });

        return { code, expiresAt: input.expiresAt };
    };
}