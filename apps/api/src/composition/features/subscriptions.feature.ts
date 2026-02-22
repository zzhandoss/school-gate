import {
    createListSubscriptionsAdminUC,
    createPersonsService,
    createResolveSubscriptionRequestPersonFlow,
    createReviewSubscriptionRequestFlow,
    createSetSubscriptionStatusFlow,
    createSubscriptionRequestsService,
    createSubscriptionsService,
    type ReviewSubscriptionRequestTx,
    type SetSubscriptionStatusTx
} from "@school-gate/core";
import {
    createOutbox,
    createPersonsRepo,
    createSubscriptionRequestsRepo,
    createSubscriptionsAdminQuery,
    createSubscriptionsRepo,
    createUnitOfWork
} from "@school-gate/infra";
import type { SubscriptionRequestsModule } from "../../delivery/http/routes/subscriptionRequests.routes.js";
import type { SubscriptionsModule } from "../../delivery/http/routes/subscriptions.routes.js";
import type { ApiRuntime } from "../../runtime/createRuntime.js";
import type {
    ListPendingSubscriptionRequestsQueryDto,
    ListSubscriptionsResultDto,
    SubscriptionActionResultDto,
    SubscriptionAdminDto,
    SubscriptionRequestAdminDto
} from "@school-gate/contracts";
import { SubscriptionNotFoundError } from "../errors/subscriptionNotFound.error.js";

function toListPendingForAdminInput(input: ListPendingSubscriptionRequestsQueryDto) {
    const payload: {
        limit: number;
        offset?: number;
        status?: "all" | "pending" | "approved" | "rejected" | "not_pending";
        only?: "all" | "ready_for_review" | "needs_person" | "new";
        order?: "oldest" | "newest";
    } = { limit: input.limit };

    if (input.offset !== undefined) {
        payload.offset = input.offset;
    }
    if (input.status !== undefined) {
        payload.status = input.status;
    }
    if (input.only !== undefined) {
        payload.only = input.only;
    }
    if (input.order !== undefined) {
        payload.order = input.order;
    }

    return payload;
}

function toSubscriptionRequestAdminDto(request: {
    id: string;
    tgUserId: string;
    iin: string;
    status: "pending" | "approved" | "rejected";
    resolutionStatus: "new" | "ready_for_review" | "needs_person";
    personId: string | null;
    resolutionMessage: string | null;
    resolvedAt: Date | null;
    createdAt: Date;
    reviewedAt: Date | null;
    reviewedBy: string | null;
}): SubscriptionRequestAdminDto {
    return {
        id: request.id,
        tgUserId: request.tgUserId,
        iin: request.iin,
        status: request.status,
        resolutionStatus: request.resolutionStatus,
        personId: request.personId,
        resolutionMessage: request.resolutionMessage,
        resolvedAt: request.resolvedAt ? request.resolvedAt.toISOString() : null,
        createdAt: request.createdAt.toISOString(),
        reviewedAt: request.reviewedAt ? request.reviewedAt.toISOString() : null,
        reviewedBy: request.reviewedBy
    };
}

function toSubscriptionAdminDto(row: {
    id: string;
    tgUserId: string;
    personId: string;
    isActive: boolean;
    createdAt: Date;
    person: {
        id: string;
        iin: string;
        firstName: string | null;
        lastName: string | null;
    };
    parent: {
        tgUserId: string;
        chatId: string;
    };
}): SubscriptionAdminDto {
    return {
        id: row.id,
        tgUserId: row.tgUserId,
        personId: row.personId,
        isActive: row.isActive,
        createdAt: row.createdAt.toISOString(),
        person: {
            id: row.person.id,
            iin: row.person.iin,
            firstName: row.person.firstName,
            lastName: row.person.lastName
        },
        parent: {
            tgUserId: row.parent.tgUserId,
            chatId: row.parent.chatId
        }
    };
}

export function createSubscriptionsFeature(runtime: ApiRuntime): {
    subscriptionRequests: SubscriptionRequestsModule;
    subscriptions: SubscriptionsModule;
} {
    const subscriptionRequestsService = createSubscriptionRequestsService({
        subscriptionRequestsRepo: createSubscriptionRequestsRepo(runtime.dbClient.db)
    });
    const personsService = createPersonsService({
        personsRepo: createPersonsRepo(runtime.dbClient.db)
    });
    const listSubscriptionsAdmin = createListSubscriptionsAdminUC({
        subscriptionsAdminQuery: createSubscriptionsAdminQuery(runtime.dbClient.db)
    });

    const reviewSubscriptionRequest = createReviewSubscriptionRequestFlow({
        subscriptionRequestsService,
        tx: createUnitOfWork(runtime.dbClient.db, {
            subscriptionRequestsService: (db) =>
                createSubscriptionRequestsService({ subscriptionRequestsRepo: createSubscriptionRequestsRepo(db) }),
            subscriptionsService: (db) =>
                createSubscriptionsService({ subscriptionsRepo: createSubscriptionsRepo(db) }),
            outbox: createOutbox
        }) as ReviewSubscriptionRequestTx,
        idGen: runtime.idGen,
        clock: runtime.clock
    });
    const resolveSubscriptionRequestPerson = createResolveSubscriptionRequestPersonFlow({
        subscriptionRequestsService,
        personsService,
        outbox: createOutbox(runtime.dbClient.db),
        idGen: runtime.idGen,
        clock: runtime.clock
    });
    const setSubscriptionStatus = createSetSubscriptionStatusFlow({
        tx: createUnitOfWork(runtime.dbClient.db, {
            subscriptionsRepo: createSubscriptionsRepo,
            outbox: createOutbox
        }) as SetSubscriptionStatusTx,
        idGen: runtime.idGen,
        clock: runtime.clock
    });

    return {
        subscriptionRequests: {
            listPending: async (input: ListPendingSubscriptionRequestsQueryDto) => {
                const result = await subscriptionRequestsService.listForAdmin(
                    toListPendingForAdminInput(input)
                );
                return {
                    requests: result.requests.map(toSubscriptionRequestAdminDto),
                    page: {
                        limit: input.limit,
                        offset: input.offset ?? 0,
                        total: result.total
                    }
                };
            },
            resolvePerson: (input) => resolveSubscriptionRequestPerson(input),
            review: (input) => reviewSubscriptionRequest(input)
        },
        subscriptions: {
            list: async (input) => {
                const rows = await listSubscriptionsAdmin(input);
                const dto: ListSubscriptionsResultDto = {
                    subscriptions: rows.map(toSubscriptionAdminDto)
                };
                return dto;
            },
            activate: async ({ subscriptionId, adminId }) => {
                const updated = await setSubscriptionStatus({ subscriptionId, isActive: true, adminId });
                if (!updated) {
                    throw new SubscriptionNotFoundError();
                }
                const dto: SubscriptionActionResultDto = { subscriptionId, isActive: true };
                return dto;
            },
            deactivate: async ({ subscriptionId, adminId }) => {
                const updated = await setSubscriptionStatus({ subscriptionId, isActive: false, adminId });
                if (!updated) {
                    throw new SubscriptionNotFoundError();
                }
                const dto: SubscriptionActionResultDto = { subscriptionId, isActive: false };
                return dto;
            }
        }
    };
}
