import { AdminTgLinkNotFoundError } from "../../utils/errors.js";
import type { AdminTgCodesService, AdminTgCodesServiceDeps } from "./adminTgCodes.types.js";

export function createAdminTgCodesService(deps: AdminTgCodesServiceDeps): AdminTgCodesService {
    return {
        withTx(tx: unknown) {
            return createAdminTgCodesService({
                ...deps,
                adminTgCodesRepo: deps.adminTgCodesRepo.withTx(tx)
            });
        },


        create(input) {
            return deps.adminTgCodesRepo.create(input);
        },
        getByCodeHash(codeHash) {
            return deps.adminTgCodesRepo.getByCodeHash(codeHash);
        },
        async markUsed(input) {
            const updated = await deps.adminTgCodesRepo.markUsed({
                codeHash: input.codeHash,
                usedAt: input.usedAt
            });
            if (!updated) {
                throw new AdminTgLinkNotFoundError();
            }
        }
    };
}

