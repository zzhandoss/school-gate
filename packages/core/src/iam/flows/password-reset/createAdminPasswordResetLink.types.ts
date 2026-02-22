import type { OutboxRepo } from "../../../ports/outbox.js";
import type { AdminsService } from "../../services/admins.types.js";
import type { PasswordResetsService } from "../../services/passwordResets.types.js";
import type { TokenHasher } from "../../../ports/tokenHasher.js";
import type { Clock, IdGenerator } from "../../../utils/common.types.js";

export type CreateAdminPasswordResetLinkInput = {
    adminId: string;
    expiresAt: Date;
    requestedByAdminId?: string | undefined;
};

export type CreateAdminPasswordResetLinkResult = {
    token: string;
    expiresAt: Date;
};

export type CreateAdminPasswordResetLinkFlow = (
    input: CreateAdminPasswordResetLinkInput
) => Promise<CreateAdminPasswordResetLinkResult>;

export type CreateAdminPasswordResetLinkDeps = {
    adminsService: AdminsService;
    passwordResetsService: PasswordResetsService;
    outbox: OutboxRepo;
    tokenHasher: TokenHasher;
    idGen: IdGenerator;
    clock: Clock;
};