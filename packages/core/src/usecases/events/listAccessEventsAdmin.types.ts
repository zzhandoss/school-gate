import type {
    AccessEventAdminView,
    AccessEventsAdminQueryPort,
    ListAccessEventsAdminInput
} from "../../ports/index.js";

export type ListAccessEventsAdminDeps = {
    accessEventsAdminQuery: AccessEventsAdminQueryPort;
};

export type ListAccessEventsAdminUC = (
    input: ListAccessEventsAdminInput
) => Promise<{ events: AccessEventAdminView[]; total: number }>;
