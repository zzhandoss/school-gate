import type {
    ListAccessEventsAdminDeps,
    ListAccessEventsAdminUC,
} from "./listAccessEventsAdmin.types.js";

export function createListAccessEventsAdminUC(
    deps: ListAccessEventsAdminDeps
): ListAccessEventsAdminUC {
    return (input) => deps.accessEventsAdminQuery.list(input);
}
