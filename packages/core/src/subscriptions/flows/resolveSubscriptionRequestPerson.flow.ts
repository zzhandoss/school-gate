import { enqueueAuditRequested } from "../../audit/index.js";
import {
    PersonNotFoundError,
    SubscriptionRequestNotFoundError,
    SubscriptionRequestNotPendingError
} from "../../utils/errors.js";
import type {
    ResolveSubscriptionRequestPersonDeps,
    ResolveSubscriptionRequestPersonFlow
} from "./resolveSubscriptionRequestPerson.types.js";

export function createResolveSubscriptionRequestPersonFlow(
    deps: ResolveSubscriptionRequestPersonDeps
): ResolveSubscriptionRequestPersonFlow {
    return async function resolve(input) {
        const request = await deps.subscriptionRequestsService.getById(input.requestId);
        if (!request) {
            throw new SubscriptionRequestNotFoundError();
        }

        if (request.status !== "pending") {
            throw new SubscriptionRequestNotPendingError();
        }

        const person = await deps.personsService.getById(input.personId);
        if (!person) {
            throw new PersonNotFoundError();
        }

        const resolvedAt = deps.clock.now();

        await deps.subscriptionRequestsService.markReadyForReview({
            id: request.id,
            personId: person.id,
            resolvedAt
        });

        enqueueAuditRequested({
            outbox: deps.outbox,
            id: deps.idGen.nextId(),
            actorId: input.adminId ?? "system:subscription_resolver",
            action: "subscription_request_resolved_person",
            entityType: "subscription_request",
            entityId: request.id,
            at: resolvedAt,
            meta: { personId: person.id, iin: request.iin },
        });

        return {
            requestId: request.id,
            resolutionStatus: "ready_for_review",
            personId: person.id
        };
    };
}
