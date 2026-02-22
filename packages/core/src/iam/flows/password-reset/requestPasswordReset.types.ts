import type { OutboxRepo } from "../../../ports/outbox.js";
import type { AdminsService } from "../../services/admins.types.js";
import type { PasswordResetsService } from "../../services/passwordResets.types.js";
import type { TokenHasher } from "../../../ports/tokenHasher.js";
import type { Clock, IdGenerator } from "../../../utils/common.types.js";

export type RequestPasswordResetInput = {
    email: string;
    expiresAt: Date;
};

export type RequestPasswordResetResult = {
    token: string | null;
};

export type RequestPasswordResetFlow = (input: RequestPasswordResetInput) => Promise<RequestPasswordResetResult>;

export type RequestPasswordResetDeps = {
    adminsService: AdminsService;
    passwordResetsService: PasswordResetsService;
    outbox: OutboxRepo;
    tokenHasher: TokenHasher;
    idGen: IdGenerator;
    clock: Clock;
};