import type { OutboxRepo } from "../../../ports/outbox.js";
import type { AdminTgCodesService } from "../../services/adminTgCodes.types.js";
import type { AdminsService } from "../../services/admins.types.js";
import type { TokenHasher } from "../../../ports/tokenHasher.js";
import type { Clock, IdGenerator } from "../../../utils/common.types.js";

export type LinkTelegramByCodeInput = {
    code: string;
    tgUserId: string;
};

export type LinkTelegramByCodeResult = {
    adminId: string;
};

export type LinkTelegramByCodeFlow = (
    input: LinkTelegramByCodeInput
) => Promise<LinkTelegramByCodeResult>;

export type LinkTelegramByCodeDeps = {
    adminsService: AdminsService;
    adminTgCodesService: AdminTgCodesService;
    outbox: OutboxRepo;
    tokenHasher: TokenHasher;
    idGen: IdGenerator;
    clock: Clock;
};