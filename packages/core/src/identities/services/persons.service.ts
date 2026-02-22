import { isValidIin, normalizeIin } from "../../utils/iin.js";
import type { PersonsService, PersonsServiceDeps } from "./persons.types.js";

export function createPersonsService(deps: PersonsServiceDeps): PersonsService {
    return {
        withTx(tx: unknown) {
            return createPersonsService({
                ...deps,
                personsRepo: deps.personsRepo.withTx(tx),
            });
        },



        create(input) {
            return deps.personsRepo.create(input);
        },
        getById(id) {
            return deps.personsRepo.getById(id);
        },
        getByIin(iin) {
            return deps.personsRepo.getByIin(iin);
        },
        list(input) {
            return deps.personsRepo.list(input);
        },
        count(input) {
            return deps.personsRepo.count(input);
        },
        searchByIinPrefix(input) {
            return deps.personsRepo.searchByIinPrefix(input);
        },
        getByTerminalPersonId(terminalPersonId) {
            return deps.personsRepo.getByTerminalPersonId(terminalPersonId);
        },
        updateById(input) {
            return deps.personsRepo.updateById(input);
        },
        async searchByIin(input) {
            const iin = normalizeIin(input.iin);
            if (isValidIin(iin)) {
                const person = await deps.personsRepo.getByIin(iin);
                return person ? [person] : [];
            }
            return deps.personsRepo.searchByIinPrefix({ iinPrefix: iin, limit: input.limit });
        },
    };
}


