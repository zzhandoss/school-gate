import { DomainEvents } from "../../events/domain.js";
import type { SetSubscriptionStatusDeps, SetSubscriptionStatusFlow } from "./setSubscriptionStatus.types.js";

export function createSetSubscriptionStatusFlow(
    deps: SetSubscriptionStatusDeps
): SetSubscriptionStatusFlow {
    return async function setSubscriptionStatus(input) {
        const updated = deps.tx.run(({ subscriptionsRepo, outbox }) => {
            const ok = subscriptionsRepo.setActiveByIdSync({
                id: input.subscriptionId,
                isActive: input.isActive,
            });
            if (!ok) return false;

            outbox.enqueue({
                id: deps.idGen.nextId(),
                event: {
                    type: DomainEvents.AUDIT_REQUESTED,
                    payload: {
                        actorId: input.adminId,
                        action: input.isActive ? "subscription_activated" : "subscription_deactivated",
                        entityType: "subscription",
                        entityId: input.subscriptionId,
                        at: deps.clock.now().toISOString(),
                        meta: { isActive: input.isActive },
                    },
                },
            });

            return true;
        });

        return updated;
    };
}
