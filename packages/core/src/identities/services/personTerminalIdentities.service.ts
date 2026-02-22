import type {
    PersonTerminalIdentitiesService,
    PersonTerminalIdentitiesServiceDeps,
} from "./personTerminalIdentities.types.js";

export function createPersonTerminalIdentitiesService(
    deps: PersonTerminalIdentitiesServiceDeps
): PersonTerminalIdentitiesService {
    return {
        withTx(tx: unknown) {
            return createPersonTerminalIdentitiesService({
                ...deps,
                personTerminalIdentitiesRepo: deps.personTerminalIdentitiesRepo.withTx(tx),
            });
        },



        upsert(input) {
            return deps.personTerminalIdentitiesRepo.upsert(input);
        },
        create(input) {
            return deps.personTerminalIdentitiesRepo.create(input);
        },
        getById(input) {
            return deps.personTerminalIdentitiesRepo.getById(input);
        },
        getByDeviceAndTerminalPersonId(input) {
            return deps.personTerminalIdentitiesRepo.getByDeviceAndTerminalPersonId(input);
        },
        getByPersonAndDevice(input) {
            return deps.personTerminalIdentitiesRepo.getByPersonAndDevice(input);
        },
        updateById(input) {
            return deps.personTerminalIdentitiesRepo.updateById(input);
        },
        deleteById(input) {
            return deps.personTerminalIdentitiesRepo.deleteById(input);
        },
        listByPersonId(input) {
            return deps.personTerminalIdentitiesRepo.listByPersonId(input);
        },
    };
}


