import { enqueueAuditRequested } from "../../audit/events/auditRequested.js";
import { PersonNotFoundError } from "../../utils/errors.js";
import type { DeletePersonFlow, DeletePersonFlowDeps } from "./deletePerson.types.js";

const PERSON_DELETE_MESSAGE = "linked_person_deleted";

export function createDeletePersonFlow(deps: DeletePersonFlowDeps): DeletePersonFlow {
    return async function deletePerson(input) {
        const person = await deps.personsService.getById(input.personId);
        if (!person) {
            throw new PersonNotFoundError();
        }

        const deletedAt = deps.clock.now();

        return deps.tx.run(({ personsRepo, personTerminalIdentitiesRepo, subscriptionsRepo, subscriptionRequestsRepo, outbox }) => {
            const detachedIdentities = personTerminalIdentitiesRepo.deleteByPersonIdSync({ personId: person.id });
            const deactivatedSubscriptions = subscriptionsRepo.deactivateByPersonIdSync({ personId: person.id });
            const requestStats = subscriptionRequestsRepo.unlinkPersonByPersonIdSync({
                personId: person.id,
                message: PERSON_DELETE_MESSAGE,
                resolvedAt: deletedAt
            });
            const deleted = personsRepo.deleteByIdSync({ id: person.id });

            if (!deleted) {
                throw new PersonNotFoundError();
            }

            const result = {
                personId: person.id,
                deleted: true as const,
                detachedIdentities,
                deactivatedSubscriptions,
                unlinkedRequests: requestStats.updated,
                resetRequestsToNeedsPerson: requestStats.resetToNeedsPerson
            };

            enqueueAuditRequested({
                outbox,
                id: deps.idGen.nextId(),
                actorId: input.adminId ?? "system:person_delete",
                action: "person_deleted",
                entityType: "person",
                entityId: person.id,
                at: deletedAt,
                meta: {
                    iin: person.iin,
                    detachedIdentities,
                    deactivatedSubscriptions,
                    unlinkedRequests: requestStats.updated,
                    resetRequestsToNeedsPerson: requestStats.resetToNeedsPerson
                }
            });

            return result;
        });
    };
}
