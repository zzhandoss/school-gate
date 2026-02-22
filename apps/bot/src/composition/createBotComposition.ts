import type { Db } from "@school-gate/db/drizzle";
import {
    createAdminTgCodesService,
    createAdminsService,
    createLinkTelegramByCodeFlow,
    createParentsService,
    createRequestSubscriptionFlow,
    createSetParentSubscriptionStatusFlow,
    createSubscriptionRequestsService,
    type Clock,
    type IdGenerator
} from "@school-gate/core";
import {
    createAdminTgCodesRepo,
    createAdminsRepo,
    createArgon2PasswordHasher,
    createOutbox,
    createParentsRepo,
    createSubscriptionRequestsRepo,
    createSubscriptionsAdminQuery,
    createSubscriptionsRepo,
    createTokenHasher,
    createUnitOfWork
} from "@school-gate/infra";
import type { AdminBotService } from "../application/adminBotService.js";
import type { ParentBotService, ParentDashboardView } from "../application/parentBotService.js";

type BotCompositionInput = {
    db: Db;
    idGen: IdGenerator;
    clock: Clock;
};

const REQUESTS_LIMIT = 30;
const SUBSCRIPTIONS_LIMIT = 50;

function toDashboardView(input: {
    subscriptions: Array<{
        id: string;
        isActive: boolean;
        person: {
            iin: string;
            firstName: string | null;
            lastName: string | null;
        };
    }>;
    requests: Array<{
        id: string;
        iin: string;
        status: "pending" | "approved" | "rejected";
        resolutionStatus: "new" | "ready_for_review" | "needs_person";
        resolutionMessage: string | null;
        createdAt: Date;
    }>;
}): ParentDashboardView {
    return {
        subscriptions: input.subscriptions.map((row) => ({
            id: row.id,
            isActive: row.isActive,
            person: {
                iin: row.person.iin,
                firstName: row.person.firstName,
                lastName: row.person.lastName
            }
        })),
        requests: input.requests.map((row) => ({
            id: row.id,
            iin: row.iin,
            status: row.status,
            resolutionStatus: row.resolutionStatus,
            resolutionMessage: row.resolutionMessage,
            createdAt: row.createdAt.toISOString()
        }))
    };
}

export function createBotComposition(input: BotCompositionInput): {
    parentBotService: ParentBotService;
    adminBotService: AdminBotService;
} {
    const parentsService = createParentsService({
        parentsRepo: createParentsRepo(input.db)
    });
    const subscriptionRequestsService = createSubscriptionRequestsService({
        subscriptionRequestsRepo: createSubscriptionRequestsRepo(input.db)
    });
    const subscriptionsAdminQuery = createSubscriptionsAdminQuery(input.db);
    const adminsService = createAdminsService({
        adminsRepo: createAdminsRepo(input.db),
        passwordHasher: createArgon2PasswordHasher()
    });
    const adminTgCodesService = createAdminTgCodesService({
        adminTgCodesRepo: createAdminTgCodesRepo(input.db)
    });
    const linkTelegramByCode = createLinkTelegramByCodeFlow({
        adminsService,
        adminTgCodesService,
        outbox: createOutbox(input.db),
        tokenHasher: createTokenHasher(),
        idGen: input.idGen,
        clock: input.clock
    });

    const requestSubscriptionFlow = createRequestSubscriptionFlow({
        parentsService,
        subscriptionRequestsService,
        outbox: createOutbox(input.db),
        idGen: input.idGen,
        clock: input.clock
    });

    const setParentSubscriptionStatus = createSetParentSubscriptionStatusFlow({
        tx: createUnitOfWork(input.db, {
            subscriptionsRepo: createSubscriptionsRepo,
            outbox: createOutbox
        }),
        idGen: input.idGen,
        clock: input.clock
    });

    const parentBotService: ParentBotService = {
        async requestSubscription(payload) {
            const result = await requestSubscriptionFlow(payload);
            return { requestId: result.requestId };
        },
        async getDashboard(payload) {
            const [subscriptions, requests] = await Promise.all([
                subscriptionsAdminQuery.list({
                    limit: SUBSCRIPTIONS_LIMIT,
                    offset: 0,
                    tgUserId: payload.tgUserId
                }),
                subscriptionRequestsService.listByTgUserId({
                    tgUserId: payload.tgUserId,
                    limit: REQUESTS_LIMIT
                })
            ]);

            return toDashboardView({ subscriptions, requests });
        },
        async setSubscriptionStatus(payload) {
            const result = await setParentSubscriptionStatus(payload);
            return {
                subscriptionId: result.id,
                isActive: result.isActive
            };
        }
    };

    const adminBotService: AdminBotService = {
        async getAccess(payload) {
            const admin = await adminsService.getByTgUserId(payload.tgUserId);
            if (!admin) return null;
            return {
                adminId: admin.id,
                email: admin.email,
                name: admin.name,
                roleId: admin.roleId
            };
        },
        async linkTelegramByCode(payload) {
            return linkTelegramByCode(payload);
        }
    };

    return { parentBotService, adminBotService };
}
