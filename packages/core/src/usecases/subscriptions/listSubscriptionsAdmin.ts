import type {
    ListSubscriptionsAdminDeps,
    ListSubscriptionsAdminUC
} from "./listSubscriptionsAdmin.types.js";

export function createListSubscriptionsAdminUC(
    deps: ListSubscriptionsAdminDeps
): ListSubscriptionsAdminUC {
    return (input) => deps.subscriptionsAdminQuery.list(input);
}
