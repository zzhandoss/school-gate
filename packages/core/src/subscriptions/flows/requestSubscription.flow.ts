import { enqueueAuditRequested } from "../../audit/events/auditRequested.js";
import { InvalidIinError, PendingRequestAlreadyExistsError } from "../../utils/errors.js";
import { isValidIin, normalizeIin } from "../../utils/iin.js";
import type { RequestSubscriptionDeps, RequestSubscriptionFlow } from "./requestSubscription.types.js";

export function createRequestSubscriptionFlow(deps: RequestSubscriptionDeps): RequestSubscriptionFlow {
    return async function requestSubscription(input) {
        const iin = normalizeIin(input.iin);

        if (!isValidIin(iin)) {
            throw new InvalidIinError();
        }

        await deps.parentsService.upsert({ tgUserId: input.tgUserId, chatId: input.chatId });

        const existing = await deps.subscriptionRequestsService.getPendingByTgUserAndIin({
            tgUserId: input.tgUserId,
            iin,
        });

        if (existing) {
            throw new PendingRequestAlreadyExistsError();
        }

        const requestId = deps.idGen.nextId();

        try {
            await deps.subscriptionRequestsService.createPending({
                id: requestId,
                tgUserId: input.tgUserId,
                iin,
            });
        } catch (e: any) {
            if (String(e?.message) === "SUBSCRIPTION_REQUEST_PENDING_ALREADY_EXISTS") {
                throw new PendingRequestAlreadyExistsError();
            }
            throw e;
        }

        enqueueAuditRequested({
            outbox: deps.outbox,
            id: deps.idGen.nextId(),
            actorId: `parent:${input.tgUserId}`,
            action: "subscription_request_created",
            entityType: "subscription_request",
            entityId: requestId,
            at: deps.clock.now(),
            meta: { iin, chatId: input.chatId },
        });

        return { requestId, status: "pending", iin };
    };
}