import { DomainEvents } from "../../events/domain.js";
import { SubscriptionAccessDeniedError, SubscriptionNotFoundError } from "../../utils/errors.js";
import type {
    SetParentSubscriptionStatusDeps,
    SetParentSubscriptionStatusFlow
} from "./setParentSubscriptionStatus.types.js";

export function createSetParentSubscriptionStatusFlow(
    deps: SetParentSubscriptionStatusDeps
): SetParentSubscriptionStatusFlow {
    return async function setParentSubscriptionStatus(input) {
        return deps.tx.run(({ subscriptionsRepo, outbox }) => {
            const subscription = subscriptionsRepo.getByIdSync(input.subscriptionId);
            if (!subscription) {
                throw new SubscriptionNotFoundError();
            }

            if (subscription.tgUserId !== input.tgUserId) {
                throw new SubscriptionAccessDeniedError();
            }

            subscriptionsRepo.setActiveByIdSync({
                id: input.subscriptionId,
                isActive: input.isActive
            });

            outbox.enqueue({
                id: deps.idGen.nextId(),
                event: {
                    type: DomainEvents.AUDIT_REQUESTED,
                    payload: {
                        actorId: `parent:${input.tgUserId}`,
                        action: input.isActive ? "parent_subscription_activated" : "parent_subscription_deactivated",
                        entityType: "subscription",
                        entityId: input.subscriptionId,
                        at: deps.clock.now().toISOString(),
                        meta: { isActive: input.isActive }
                    }
                }
            });

            return { id: input.subscriptionId, isActive: input.isActive };
        });
    };
}
