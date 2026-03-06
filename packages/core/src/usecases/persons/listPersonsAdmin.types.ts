import type {
    ListPersonsAdminInput,
    PersonAdminView,
    PersonsAdminQueryPort
} from "../../ports/index.js";

export type ListPersonsAdminDeps = {
    personsAdminQuery: PersonsAdminQueryPort;
};

export type ListPersonsAdminUC = (
    input: ListPersonsAdminInput
) => Promise<{ persons: PersonAdminView[]; total: number }>;
