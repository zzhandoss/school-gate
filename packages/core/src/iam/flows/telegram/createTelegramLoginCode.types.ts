import type { OutboxRepo } from "../../../ports/outbox.js";
import type { AdminsService } from "../../services/admins.types.js";
import type { AdminTgCodesService } from "../../services/adminTgCodes.types.js";
import type { TokenHasher } from "../../../ports/tokenHasher.js";
import type { Clock, IdGenerator } from "../../../utils/common.types.js";

export type CreateTelegramLoginCodeInput = {
    adminId: string;
    expiresAt: Date;
};

export type CreateTelegramLoginCodeResult = {
    code: string;
    expiresAt: Date;
};

export type CreateTelegramLoginCodeFlow = (
    input: CreateTelegramLoginCodeInput
) => Promise<CreateTelegramLoginCodeResult>;

export type CreateTelegramLoginCodeDeps = {
    adminsService: AdminsService;
    adminTgCodesService: AdminTgCodesService;
    outbox: OutboxRepo;
    tokenHasher: TokenHasher;
    idGen: IdGenerator;
    clock: Clock;
};