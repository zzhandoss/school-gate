import type { OutboxRepo } from "../../../ports/outbox.js";
import type { AdminInvitesService } from "../../services/adminInvites.types.js";
import type { RolesService } from "../../services/roles.types.js";
import type { TokenHasher } from "../../../ports/tokenHasher.js";
import type { Clock, IdGenerator } from "../../../utils/common.types.js";

export type CreateAdminInviteInput = {
    roleId: string;
    email?: string | null | undefined;
    createdBy: string;
    expiresAt: Date;
};

export type CreateAdminInviteResult = {
    token: string;
    tokenHash: string;
    roleId: string;
    email: string | null;
    expiresAt: Date;
};

export type CreateAdminInviteFlow = (input: CreateAdminInviteInput) => Promise<CreateAdminInviteResult>;

export type CreateAdminInviteDeps = {
    rolesService: RolesService;
    adminInvitesService: AdminInvitesService;
    outbox?: OutboxRepo | undefined;
    tokenHasher: TokenHasher;
    idGen: IdGenerator;
    clock: Clock;
};
