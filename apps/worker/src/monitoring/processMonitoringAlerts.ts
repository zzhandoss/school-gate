import {
    type AlertEventsTx,
    type Clock, createAlertEventsService,
    createAlertRulesService, createAlertSubscriptionsService,
    createProcessMonitoringAlertsFlow, type IdGenerator
} from "@school-gate/core";
import type { Db } from "@school-gate/db";
import {
    createAlertEventsRepo,
    createAlertRulesRepo,
    createAlertSubscriptionsRepo,
    createOutbox,
    createUnitOfWork
} from "@school-gate/infra";

export function processMonitoringAlerts(db: Db, idGen: IdGenerator, clock: Clock) {
    const eventsRepo = createAlertEventsRepo(db);
    const rulesRepo = createAlertRulesRepo(db);
    const subscriptionsRepo = createAlertSubscriptionsRepo(db);

    const rulesService = createAlertRulesService({ rulesRepo, idGen, clock });
    const eventsService = createAlertEventsService({ eventsRepo });
    const subscriptionsService = createAlertSubscriptionsService({ subscriptionsRepo, clock });

    const tx: AlertEventsTx = createUnitOfWork(db, {
        alertEventsService: (db) => eventsService.withTx(db),
        outbox: createOutbox
    });

    return createProcessMonitoringAlertsFlow({
        rulesService: rulesService,
        eventsService: eventsService,
        subscriptionsService: subscriptionsService,
        tx: tx,
        idGen: idGen,
        clock: clock
    });
}
