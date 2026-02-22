import type { AlertEventStatus } from "../entities/alertEvents.types.js";
import type { UnknownAlertRule } from "../entities/alertRules.types.js";
import type {
    ProcessMonitoringAlertsFlowDeps,
    ProcessMonitoringAlertsInput,
    ProcessMonitoringAlertsResult,
} from "./processMonitoringAlerts.types.js";
import { DomainEvents } from "../../events/domain.js";
import { evaluateAlertRule } from "../rules/registry.js";
import { createAlertEventsService } from "../services/alertEvents.service.js";

function buildMessage(rule: UnknownAlertRule, status: AlertEventStatus, body: string): string {
    const prefix = status === "triggered" ? "Alert triggered" : "Alert resolved";
    const severity = rule.severity.toUpperCase();
    return `[${severity}] ${prefix}: ${rule.name}. ${body}`;
}

export function createProcessMonitoringAlertsFlow(deps: ProcessMonitoringAlertsFlowDeps) {
    return async function processMonitoringAlerts(
        input: ProcessMonitoringAlertsInput
    ): Promise<ProcessMonitoringAlertsResult> {
        const rules = await deps.rulesService.list({ limit: 500, offset: 0, onlyEnabled: true });
        if (rules.length === 0) {
            return { evaluated: 0, triggered: 0, resolved: 0, skipped: 0 };
        }

        const ruleIds = rules.map((rule) => rule.id);
        const latestEvents = await deps.eventsService.listLatestByRuleIds({ ruleIds });
        const lastStatusByRule = new Map(latestEvents.map((event) => [event.ruleId, event.status]));

        const recipients = await deps.subscriptionsService.listRecipientsByRuleIds({
            ruleIds,
            onlyEnabled: true,
        });
        const recipientsByRule = new Map<string, typeof recipients>();
        for (const recipient of recipients) {
            const list = recipientsByRule.get(recipient.ruleId) ?? [];
            list.push(recipient);
            recipientsByRule.set(recipient.ruleId, list);
        }

        let evaluated = 0;
        let triggered = 0;
        let resolved = 0;
        let skipped = 0;

        for (const rule of rules) {
            evaluated++;
            const evaluation = evaluateAlertRule(rule, {
                snapshot: input.snapshot.snapshot,
                previousSnapshot: input.previousSnapshot?.snapshot,
            });
            if (evaluation.skipReason) {
                skipped++;
                continue;
            }

            const lastStatus = lastStatusByRule.get(rule.id);
            if (evaluation.condition && lastStatus !== "triggered") {
                triggered++;
                const eventId = deps.idGen.nextId();
                const createdAt = deps.clock.now();
                const message = buildMessage(rule, "triggered", evaluation.triggeredMessage);
                const ruleRecipients = recipientsByRule.get(rule.id) ?? [];

                deps.tx.run(({ alertEventsService, outbox }) => {
                    alertEventsService.insertSync({
                        id: eventId,
                        ruleId: rule.id,
                        snapshotId: input.snapshot.id,
                        status: "triggered",
                        severity: rule.severity,
                        message,
                        details: evaluation.details,
                        createdAt,
                    });

                    for (const recipient of ruleRecipients) {
                        outbox.enqueue({
                            id: deps.idGen.nextId(),
                            event: {
                                type: DomainEvents.ALERT_NOTIFICATION_REQUESTED,
                                payload: {
                                    alertEventId: eventId,
                                    ruleId: rule.id,
                                    ruleName: rule.name,
                                    severity: rule.severity,
                                    status: "triggered",
                                    message,
                                    createdAt: createdAt.toISOString(),
                                    tgUserId: recipient.tgUserId,
                                },
                            },
                        });
                    }
                });
            }

            if (!evaluation.condition && lastStatus === "triggered") {
                resolved++;
                const eventId = deps.idGen.nextId();
                const createdAt = deps.clock.now();
                const message = buildMessage(rule, "resolved", evaluation.resolvedMessage);
                const ruleRecipients = recipientsByRule.get(rule.id) ?? [];

                deps.tx.run(({ alertEventsService, outbox }) => {
                    alertEventsService.insertSync({
                        id: eventId,
                        ruleId: rule.id,
                        snapshotId: input.snapshot.id,
                        status: "resolved",
                        severity: rule.severity,
                        message,
                        details: evaluation.details,
                        createdAt,
                    });

                    for (const recipient of ruleRecipients) {
                        outbox.enqueue({
                            id: deps.idGen.nextId(),
                            event: {
                                type: DomainEvents.ALERT_NOTIFICATION_REQUESTED,
                                payload: {
                                    alertEventId: eventId,
                                    ruleId: rule.id,
                                    ruleName: rule.name,
                                    severity: rule.severity,
                                    status: "resolved",
                                    message,
                                    createdAt: createdAt.toISOString(),
                                    tgUserId: recipient.tgUserId,
                                },
                            },
                        });
                    }
                });
            }
        }

        return { evaluated, triggered, resolved, skipped };
    };
}
