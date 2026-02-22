import type { ParentsService } from "./parents.types.js";
import type { ParentsServiceDeps } from "./parents.types.js";

export function createParentsService(deps: ParentsServiceDeps): ParentsService {
    return {
        withTx(tx: unknown) {
            return createParentsService({
                ...deps,
                parentsRepo: deps.parentsRepo.withTx(tx)
            });
        },



        upsert(input) {
            return deps.parentsRepo.upsert(input);
        },
        getByTgUserId(tgUserId) {
            return deps.parentsRepo.getByTgUserId(tgUserId);
        }
    };
}


