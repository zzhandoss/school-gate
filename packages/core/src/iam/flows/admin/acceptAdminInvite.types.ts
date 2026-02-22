import type { OutboxRepo } from "../../../ports/outbox.js";
import type { AdminInvitesService } from "../../services/adminInvites.types.js";
import type { AdminsService } from "../../services/admins.types.js";
import type { RolesService } from "../../services/roles.types.js";
import type { PasswordHasher } from "../../../ports/passwordHasher.js";
import type { TokenHasher } from "../../../ports/tokenHasher.js";
import type { Clock, IdGenerator } from "../../../utils/common.types.js";

export type AcceptAdminInviteInput = {
    token: string;
    email: string;
    password: string;
    name?: string | null | undefined;
};

export type AcceptAdminInviteResult = {
    adminId: string;
    roleId: string;
};

export type AcceptAdminInviteFlow = (input: AcceptAdminInviteInput) => Promise<AcceptAdminInviteResult>;

export type AcceptAdminInviteDeps = {
    adminInvitesService: AdminInvitesService;
    adminsService: AdminsService;
    rolesService: RolesService;
    outbox: OutboxRepo;
    passwordHasher: PasswordHasher;
    tokenHasher: TokenHasher;
    idGen: IdGenerator;
    clock: Clock;
};