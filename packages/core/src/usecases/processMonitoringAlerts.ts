import { createProcessMonitoringAlertsFlow } from "../alerts/flows/processMonitoringAlerts.flow.js";
import { createAlertRulesService } from "../alerts/services/alertRules.service.js";
import { createAlertSubscriptionsService } from "../alerts/services/alertSubscriptions.service.js";
import { createAlertEventsService } from "../alerts/services/alertEvents.service.js";
import type { AlertRulesRepo } from "../alerts/repos/alertRules.repo.js";
import type { AlertSubscriptionsRepo } from "../alerts/repos/alertSubscriptions.repo.js";
import type { AlertEventsRepo } from "../alerts/repos/alertEvents.repo.js";
import type { Outbox } from "../ports/outbox.js";
import type { IdGenerator, Clock } from "../utils/common.types.js";

type LegacyTx = {
    run<T>(cb: (deps: { alertEventsService: { insertSync: (input: any) => void }; outbox: Outbox }) => T): T;
};

type LegacyDeps = {
    rulesRepo: AlertRulesRepo;
    subscriptionsRepo: AlertSubscriptionsRepo;
    eventsRepo: AlertEventsRepo;
    tx: LegacyTx;
    idGen: IdGenerator;
    clock: Clock;
};

export function createProcessMonitoringAlertsUC(deps: LegacyDeps) {
    const rulesService = createAlertRulesService({
        rulesRepo: deps.rulesRepo,
        idGen: deps.idGen,
        clock: deps.clock
    });
    const subscriptionsService = createAlertSubscriptionsService({
        subscriptionsRepo: deps.subscriptionsRepo,
        clock: deps.clock
    });
    const eventsService = createAlertEventsService({ eventsRepo: deps.eventsRepo });
    const tx = {
        run<T>(cb: (deps: { alertEventsService: any; outbox: Outbox }) => T) {
            return deps.tx.run((txDeps: any) => {
                const alertEventsService = txDeps.alertEventsService
                    ?? createAlertEventsService({ eventsRepo: txDeps.alertEventsRepo });

                return cb({
                    alertEventsService,
                    outbox: txDeps.outbox
                });
            });
        }
    };

    const flow = createProcessMonitoringAlertsFlow({
        rulesService,
        subscriptionsService,
        eventsService,
        tx,
        idGen: deps.idGen,
        clock: deps.clock
    });

    return (input: any) =>
        flow({
            ...input,
            snapshot: {
                ...input.snapshot,
                id: null
            }
        });
}
