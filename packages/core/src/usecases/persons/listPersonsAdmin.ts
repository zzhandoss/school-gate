import type {
    ListPersonsAdminDeps,
    ListPersonsAdminUC
} from "./listPersonsAdmin.types.js";

export function createListPersonsAdminUC(
    deps: ListPersonsAdminDeps
): ListPersonsAdminUC {
    return (input) => deps.personsAdminQuery.list(input);
}
