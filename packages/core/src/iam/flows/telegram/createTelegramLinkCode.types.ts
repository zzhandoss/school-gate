import type { OutboxRepo } from "../../../ports/outbox.js";
import type { AdminsService } from "../../services/admins.types.js";
import type { AdminTgCodesService } from "../../services/adminTgCodes.types.js";
import type { TokenHasher } from "../../../ports/tokenHasher.js";
import type { Clock, IdGenerator } from "../../../utils/common.types.js";

export type CreateTelegramLinkCodeInput = {
    adminId: string;
    expiresAt: Date;
};

export type CreateTelegramLinkCodeResult = {
    code: string;
    expiresAt: Date;
};

export type CreateTelegramLinkCodeFlow = (
    input: CreateTelegramLinkCodeInput
) => Promise<CreateTelegramLinkCodeResult>;

export type CreateTelegramLinkCodeDeps = {
    adminsService: AdminsService;
    adminTgCodesService: AdminTgCodesService;
    outbox: OutboxRepo;
    tokenHasher: TokenHasher;
    idGen: IdGenerator;
    clock: Clock;
};