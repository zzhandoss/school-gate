import { enqueueAuditRequested } from "../../audit/events/auditRequested.js";
import type { AlertRuleConfig, AlertRuleType } from "../entities/alertRules.types.js";
import type {
    AlertRulesService,
    AlertRulesServiceDeps,
    CreateAlertRuleInput,
    CreateAlertRuleResult,
    UpdateAlertRuleInput,
} from "./alertRules.types.js";
import { parseAlertRuleConfig } from "../rules/registry.js";
import { AlertRuleConfigInvalidError, AlertRuleNotFoundError } from "../../utils/errors.js";

export function createAlertRulesService(deps: AlertRulesServiceDeps): AlertRulesService {
    return {
        withTx(tx: unknown) {
            return createAlertRulesService({
                ...deps,
                rulesRepo: deps.rulesRepo.withTx(tx),
            });
        },



        async create(input: CreateAlertRuleInput): Promise<CreateAlertRuleResult> {
            let config: AlertRuleConfig<AlertRuleType>;
            try {
                config = parseAlertRuleConfig(input.type, input.config);
            } catch (err: any) {
                throw new AlertRuleConfigInvalidError(String(err?.message ?? err));
            }

            const now = deps.clock.now();
            const ruleId = deps.idGen.nextId();
            await deps.rulesRepo.create({
                id: ruleId,
                name: input.name,
                type: input.type,
                severity: input.severity,
                isEnabled: input.isEnabled,
                config,
                createdAt: now,
                updatedAt: now,
            });
            if (deps.outbox) {
                enqueueAuditRequested({
                    outbox: deps.outbox,
                    id: deps.idGen.nextId(),
                    actorId: input.actorId ?? "system:alert_rule_create",
                    action: "alert_rule_created",
                    entityType: "alert_rule",
                    entityId: ruleId,
                    at: now,
                    meta: { name: input.name, type: input.type, severity: input.severity, isEnabled: input.isEnabled },
                });
            }
            return {
 ruleId };
        },

        async update(input: UpdateAlertRuleInput): Promise<void> {
            const current = await deps.rulesRepo.getById(input.ruleId);
            if (!current) throw new AlertRuleNotFoundError();

            let config: AlertRuleConfig<typeof current.type> | undefined;
            if (input.config !== undefined) {
                try {
                    config = parseAlertRuleConfig(current.type, input.config);
                } catch (err: any) {
                    throw new AlertRuleConfigInvalidError(String(err?.message ?? err));
                }
            }

            const updatedAt = deps.clock.now();
            const updated = await deps.rulesRepo.update({
                id: input.ruleId,
                name: input.name,
                severity: input.severity,
                isEnabled: input.isEnabled,
                config,
                updatedAt,
            });
            if (!updated) throw new AlertRuleNotFoundError();
            if (deps.outbox) {
                enqueueAuditRequested({
                    outbox: deps.outbox,
                    id: deps.idGen.nextId(),
                    actorId: input.actorId ?? "system:alert_rule_update",
                    action: "alert_rule_updated",
                    entityType: "alert_rule",
                    entityId: input.ruleId,
                    at: updatedAt,
                    meta: {
                        name: input.name,
                        severity: input.severity,
                        isEnabled: input.isEnabled,
                        hasConfig: input.config !== undefined,
                    },
                });
            }
        },

        getById(id) {
            return deps.rulesRepo.getById(id);
        },

        list(input) {
            return deps.rulesRepo.list(input);
        },
    };
}