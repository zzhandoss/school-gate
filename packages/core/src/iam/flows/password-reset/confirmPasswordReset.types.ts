import type { OutboxRepo } from "../../../ports/outbox.js";
import type { AdminsService } from "../../services/admins.types.js";
import type { PasswordResetsService } from "../../services/passwordResets.types.js";
import type { PasswordHasher } from "../../../ports/passwordHasher.js";
import type { TokenHasher } from "../../../ports/tokenHasher.js";
import type { Clock, IdGenerator } from "../../../utils/common.types.js";

export type ConfirmPasswordResetInput = {
    token: string;
    password: string;
};

export type ConfirmPasswordResetResult = {
    adminId: string;
};

export type ConfirmPasswordResetFlow = (input: ConfirmPasswordResetInput) => Promise<ConfirmPasswordResetResult>;

export type ConfirmPasswordResetDeps = {
    adminsService: AdminsService;
    passwordResetsService: PasswordResetsService;
    passwordHasher: PasswordHasher;
    outbox: OutboxRepo;
    tokenHasher: TokenHasher;
    idGen: IdGenerator;
    clock: Clock;
};