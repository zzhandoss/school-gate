import type { DeletePersonFlow, DeletePersonResult } from "./deletePerson.types.js";

export type DeletePersonsBulkInput = {
    personIds: string[];
    adminId?: string;
};

export type DeletePersonsBulkItemResult =
    | ({
        personId: string;
        status: "deleted";
    } & DeletePersonResult)
    | {
        personId: string;
        status: "not_found" | "error";
        message?: string | null;
    };

export type DeletePersonsBulkResult = {
    total: number;
    deleted: number;
    notFound: number;
    errors: number;
    results: DeletePersonsBulkItemResult[];
};

export type DeletePersonsBulkFlow = (input: DeletePersonsBulkInput) => Promise<DeletePersonsBulkResult>;

export type DeletePersonsBulkFlowDeps = {
    deletePerson: DeletePersonFlow;
};
