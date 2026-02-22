import {
    AdminDisabledError,
    AdminTgCodePurposeMismatchError,
    AdminTgLinkExpiredError,
    AdminTgLinkUsedError,
} from "../../../utils/errors.js";
import type { AdminTgCodesService } from "../../services/adminTgCodes.types.js";
import type { AdminsService } from "../../services/admins.types.js";
import type { TokenHasher } from "../../../ports/tokenHasher.js";
import type { Clock } from "../../../utils/common.types.js";
import type { AuthStrategy, TelegramCodeAuthInput } from "./authStrategy.types.js";

export function createTelegramCodeStrategy(deps: {
    adminTgCodesService: AdminTgCodesService;
    adminsService: AdminsService;
    tokenHasher: TokenHasher;
    clock: Clock;
}): AuthStrategy {
    return {
        id: "telegram_code",
        async authenticate(input: TelegramCodeAuthInput) {
            const codeHash = deps.tokenHasher.hash(input.code);
            const link = await deps.adminTgCodesService.getByCodeHash(codeHash);
            if (!link) return null;

            if (link.purpose !== "login") {
                throw new AdminTgCodePurposeMismatchError();
            }

            if (link.usedAt) {
                throw new AdminTgLinkUsedError();
            }

            if (link.expiresAt.getTime() <= deps.clock.now().getTime()) {
                throw new AdminTgLinkExpiredError();
            }

            const admin = await deps.adminsService.getById(link.adminId);
            if (!admin) return null;

            if (admin.status !== "active") {
                throw new AdminDisabledError();
            }

            await deps.adminTgCodesService.markUsed({ codeHash, usedAt: deps.clock.now() });
            return { admin };
        },
    };
}
