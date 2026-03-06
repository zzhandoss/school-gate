import { PersonNotFoundError } from "../../utils/errors.js";
import type { DeletePersonsBulkFlow, DeletePersonsBulkFlowDeps } from "./deletePersonsBulk.types.js";

export function createDeletePersonsBulkFlow(deps: DeletePersonsBulkFlowDeps): DeletePersonsBulkFlow {
    return async function deletePersonsBulk(input) {
        const personIds = Array.from(new Set(input.personIds));
        const results: Awaited<ReturnType<DeletePersonsBulkFlow>>["results"] = [];
        let deleted = 0;
        let notFound = 0;
        let errors = 0;

        for (const personId of personIds) {
            try {
                const result = await deps.deletePerson({
                    personId,
                    ...(input.adminId !== undefined ? { adminId: input.adminId } : {})
                });
                deleted += 1;
                results.push({
                    status: "deleted",
                    ...result
                });
            } catch (error) {
                if (error instanceof PersonNotFoundError) {
                    notFound += 1;
                    results.push({
                        personId,
                        status: "not_found",
                        message: "Person was not found"
                    });
                    continue;
                }

                errors += 1;
                results.push({
                    personId,
                    status: "error",
                    message: error instanceof Error ? error.message : String(error)
                });
            }
        }

        return {
            total: personIds.length,
            deleted,
            notFound,
            errors,
            results
        };
    };
}
