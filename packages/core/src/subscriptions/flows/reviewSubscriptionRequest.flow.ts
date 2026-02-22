import { DomainEvents } from "../../events/domain.js";
import {
    SubscriptionRequestNotFoundError,
    SubscriptionRequestNotPendingError,
    SubscriptionRequestNotReadyError,
} from "../../utils/errors.js";
import type { ReviewSubscriptionRequestDeps, ReviewSubscriptionRequestFlow } from "./reviewSubscriptionRequest.types.js";

function formatSubscriptionRequestReviewMessage(input: { status: "approved" | "rejected"; iin: string }): string {
    if (input.status === "approved") {
        return `Ваша заявка на подписку по ИИН ${input.iin} одобрена.`;
    }

    return `Ваша заявка на подписку по ИИН ${input.iin} отклонена.`;
}

export function createReviewSubscriptionRequestFlow(
    deps: ReviewSubscriptionRequestDeps
): ReviewSubscriptionRequestFlow {
    return async function review(input) {
        const req = await deps.subscriptionRequestsService.getById(input.requestId);
        if (!req) throw new SubscriptionRequestNotFoundError();

        if (req.status !== "pending") {
            throw new SubscriptionRequestNotPendingError();
        }

        if (input.decision === "approve") {
            if (req.resolutionStatus !== "ready_for_review" || !req.personId) {
                throw new SubscriptionRequestNotReadyError();
            }

            const reviewedAt = deps.clock.now();

            return deps.tx.run(({ subscriptionRequestsService, subscriptionsService, outbox }) => {
                subscriptionsService.upsertActiveSync({
                    id: deps.idGen.nextId(),
                    tgUserId: req.tgUserId,
                    personId: req.personId!,
                });

                subscriptionRequestsService.updateStatusSync({
                    id: req.id,
                    status: "approved",
                    reviewedAt,
                    reviewedBy: input.adminTgUserId,
                });

                outbox.enqueue({
                    id: deps.idGen.nextId(),
                    event: {
                        type: DomainEvents.AUDIT_REQUESTED,
                        payload: {
                            actorId: input.adminTgUserId,
                            action: "subscription_request_approved",
                            entityType: "subscription_request",
                            entityId: req.id,
                            at: reviewedAt.toISOString(),
                            meta: { tgUserId: req.tgUserId, personId: req.personId, iin: req.iin },
                        },
                    },
                });

                outbox.enqueue({
                    id: deps.idGen.nextId(),
                    event: {
                        type: DomainEvents.ALERT_NOTIFICATION_REQUESTED,
                        payload: {
                            alertEventId: deps.idGen.nextId(),
                            ruleId: "subscription_request_review",
                            ruleName: "Subscription Request Review",
                            severity: "warning",
                            status: "triggered",
                            message: formatSubscriptionRequestReviewMessage({
                                status: "approved",
                                iin: req.iin,
                            }),
                            createdAt: reviewedAt.toISOString(),
                            tgUserId: req.tgUserId,
                        },
                    },
                });

                return { requestId: req.id, status: "approved", personId: req.personId };
            });
        }

        return deps.tx.run(({ subscriptionRequestsService, outbox }) => {
            const reviewedAt = deps.clock.now();

            subscriptionRequestsService.updateStatusSync({
                id: req.id,
                status: "rejected",
                reviewedAt,
                reviewedBy: input.adminTgUserId,
            });

            outbox.enqueue({
                id: deps.idGen.nextId(),
                event: {
                    type: DomainEvents.AUDIT_REQUESTED,
                    payload: {
                        actorId: input.adminTgUserId,
                        action: "subscription_request_rejected",
                        entityType: "subscription_request",
                        entityId: req.id,
                        at: reviewedAt.toISOString(),
                        meta: { tgUserId: req.tgUserId, iin: req.iin, resolutionStatus: req.resolutionStatus },
                    },
                },
            });

            outbox.enqueue({
                id: deps.idGen.nextId(),
                event: {
                    type: DomainEvents.ALERT_NOTIFICATION_REQUESTED,
                    payload: {
                        alertEventId: deps.idGen.nextId(),
                        ruleId: "subscription_request_review",
                        ruleName: "Subscription Request Review",
                        severity: "warning",
                        status: "triggered",
                        message: formatSubscriptionRequestReviewMessage({
                            status: "rejected",
                            iin: req.iin,
                        }),
                        createdAt: reviewedAt.toISOString(),
                        tgUserId: req.tgUserId,
                    },
                },
            });

            return { requestId: req.id, status: "rejected", personId: req.personId ?? null };
        });
    };
}
