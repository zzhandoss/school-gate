import type { PersonAdminView } from "../models/index.js";

export type ListPersonsAdminInput = {
    limit: number;
    offset: number;
    iin?: string | undefined;
    query?: string | undefined;
    linkedStatus?: "all" | "linked" | "unlinked" | undefined;
    includeDeviceIds?: string[] | undefined;
    excludeDeviceIds?: string[] | undefined;
};

export type PersonsAdminQueryPort = {
    list(input: ListPersonsAdminInput): Promise<{ persons: PersonAdminView[]; total: number }>;
};
