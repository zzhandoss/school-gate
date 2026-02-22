import { AdminInviteNotFoundError } from "../../utils/errors.js";
import type { AdminInvitesService, AdminInvitesServiceDeps } from "./adminInvites.types.js";

export function createAdminInvitesService(deps: AdminInvitesServiceDeps): AdminInvitesService {
    return {
        withTx(tx: unknown) {
            return createAdminInvitesService({
                ...deps,
                adminInvitesRepo: deps.adminInvitesRepo.withTx(tx)
            });
        },


        create(input) {
            return deps.adminInvitesRepo.create(input);
        },
        getByTokenHash(tokenHash) {
            return deps.adminInvitesRepo.getByTokenHash(tokenHash);
        },
        async markUsed(input) {
            const updated = await deps.adminInvitesRepo.markUsed({
                tokenHash: input.tokenHash,
                usedAt: input.usedAt
            });
            if (!updated) {
                throw new AdminInviteNotFoundError();
            }
        }
    };
}

