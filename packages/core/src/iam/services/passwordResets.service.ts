import { PasswordResetNotFoundError } from "../../utils/errors.js";
import type { PasswordResetsService, PasswordResetsServiceDeps } from "./passwordResets.types.js";

export function createPasswordResetsService(deps: PasswordResetsServiceDeps): PasswordResetsService {
    return {
        withTx(tx: unknown) {
            return createPasswordResetsService({
                ...deps,
                passwordResetsRepo: deps.passwordResetsRepo.withTx(tx),
            });
        },


        create(input) {
            return deps.passwordResetsRepo.create(input);
        },
        getByTokenHash(tokenHash) {
            return deps.passwordResetsRepo.getByTokenHash(tokenHash);
        },
        async markUsed(input) {
            const updated = await deps.passwordResetsRepo.markUsed({
                tokenHash: input.tokenHash,
                usedAt: input.usedAt,
            });
            if (!updated) {
                throw new PasswordResetNotFoundError();
            }
        },
    };
}

