import {
    alertEventSchema,
    alertRuleSchema,
    alertSubscriptionSchema,
    type ListAlertEventsResultDto,
    type ListAlertRulesResultDto,
    type ListAlertSubscriptionsResultDto
} from "@school-gate/contracts";
import {
    createAdminsService,
    createAlertEventsService,
    createAlertRulesService,
    createAlertSubscriptionsService,
    createSetAlertSubscriptionUC
} from "@school-gate/core";
import {
    createAdminsRepo,
    createAlertEventsRepo,
    createAlertRulesRepo,
    createAlertSubscriptionsRepo,
    createArgon2PasswordHasher,
    createOutbox
} from "@school-gate/infra";
import type { AlertsModule } from "../../delivery/http/routes/alerts.routes.js";
import type { ApiRuntime } from "../../runtime/createRuntime.js";

export function createAlertsFeature(runtime: ApiRuntime): AlertsModule {
    const outbox = createOutbox(runtime.dbClient.db);
    const rulesService = createAlertRulesService({
        rulesRepo: createAlertRulesRepo(runtime.dbClient.db),
        outbox,
        idGen: runtime.idGen,
        clock: runtime.clock
    });
    const subscriptionsService = createAlertSubscriptionsService({
        subscriptionsRepo: createAlertSubscriptionsRepo(runtime.dbClient.db),
        clock: runtime.clock
    });
    const eventsService = createAlertEventsService({
        eventsRepo: createAlertEventsRepo(runtime.dbClient.db)
    });
    const adminsService = createAdminsService({
        adminsRepo: createAdminsRepo(runtime.dbClient.db),
        outbox,
        idGen: runtime.idGen,
        passwordHasher: createArgon2PasswordHasher()
    });

    const setAlertSubscription = createSetAlertSubscriptionUC({
        adminsService,
        rulesService,
        subscriptionsService,
        outbox,
        idGen: runtime.idGen,
        clock: runtime.clock
    });

    return {
        listRules: async (input) => {
            const rules = await rulesService.list(input);
            const data: ListAlertRulesResultDto = {
                rules: rules.map((rule) =>
                    alertRuleSchema.parse({
                        id: rule.id,
                        name: rule.name,
                        type: rule.type,
                        severity: rule.severity,
                        isEnabled: rule.isEnabled,
                        config: rule.config,
                        createdAt: rule.createdAt.toISOString(),
                        updatedAt: rule.updatedAt.toISOString()
                    })
                )
            };
            return data;
        },
        createRule: (input, adminId) => rulesService.create({ ...input, actorId: adminId }),
        updateRule: (input, adminId) => rulesService.update({ ...input, actorId: adminId }),
        listSubscriptions: async (input) => {
            const subscriptions = await subscriptionsService.list(input);
            const data: ListAlertSubscriptionsResultDto = {
                subscriptions: subscriptions.map((subscription) =>
                    alertSubscriptionSchema.parse({
                        adminId: subscription.adminId,
                        ruleId: subscription.ruleId,
                        isEnabled: subscription.isEnabled,
                        createdAt: subscription.createdAt.toISOString(),
                        updatedAt: subscription.updatedAt.toISOString()
                    })
                )
            };
            return data;
        },
        setSubscription: (input) => setAlertSubscription(input),
        listEvents: async (input) => {
            const events = await eventsService.list({
                ...input,
                from: input.from ? new Date(input.from) : undefined,
                to: input.to ? new Date(input.to) : undefined
            });
            const data: ListAlertEventsResultDto = {
                events: events.map((event) =>
                    alertEventSchema.parse({
                        id: event.id,
                        ruleId: event.ruleId,
                        snapshotId: event.snapshotId,
                        status: event.status,
                        severity: event.severity,
                        message: event.message,
                        details: event.details,
                        createdAt: event.createdAt.toISOString()
                    })
                )
            };
            return data;
        }
    };
}
