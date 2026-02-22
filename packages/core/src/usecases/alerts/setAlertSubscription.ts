import { enqueueAuditRequested } from "../../audit/events/auditRequested.js";
import type { OutboxRepo } from "../../ports/outbox.js";
import type { Clock, IdGenerator } from "../../utils/common.types.js";
import type { AlertRulesService } from "../../alerts/index.js";
import type { AlertSubscriptionsService } from "../../alerts/index.js";
import { AdminNotFoundError, AdminTelegramNotLinkedError, AlertRuleNotFoundError } from "../../utils/errors.js";
import { AdminsService } from "../../iam/index.js";

export type SetAlertSubscriptionInput = {
    adminId: string;
    ruleId: string;
    isEnabled: boolean;
};

export function createSetAlertSubscriptionUC(deps: {
    adminsService: AdminsService;
    rulesService: AlertRulesService;
    subscriptionsService: AlertSubscriptionsService;
    outbox: OutboxRepo;
    idGen: IdGenerator;
    clock: Clock;
}) {
    return async function setAlertSubscription(input: SetAlertSubscriptionInput): Promise<void> {
        const rule = await deps.rulesService.getById(input.ruleId);
        if (!rule) throw new AlertRuleNotFoundError();

        const admin = await deps.adminsService.getById(input.adminId);
        if (!admin) throw new AdminNotFoundError();
        if (input.isEnabled && !admin.tgUserId) {
            throw new AdminTelegramNotLinkedError();
        }

        await deps.subscriptionsService.upsert({
            adminId: input.adminId,
            ruleId: input.ruleId,
            isEnabled: input.isEnabled,
        });

        enqueueAuditRequested({
            outbox: deps.outbox,
            id: deps.idGen.nextId(),
            actorId: input.adminId,
            action: input.isEnabled ? "alert_subscription_enabled" : "alert_subscription_disabled",
            entityType: "alert_subscription",
            entityId: `${input.adminId}:${input.ruleId}`,
            at: deps.clock.now(),
            meta: { ruleId: input.ruleId, isEnabled: input.isEnabled },
        });
    };
}