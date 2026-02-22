import { createPersonsService } from "../identities/services/persons.service.js";
import type { PersonsRepo } from "../identities/repos/persons.repo.js";

type LegacyDeps = {
    personsRepo: PersonsRepo;
};

export function createSearchPersonsByIinUC(deps: LegacyDeps) {
    const personsService = createPersonsService({ personsRepo: deps.personsRepo });
    return (input: { iin: string; limit: number }) => personsService.searchByIin(input);
}
