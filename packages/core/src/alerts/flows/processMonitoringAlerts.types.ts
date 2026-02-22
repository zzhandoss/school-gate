import type { OutboxRepo } from "../../ports/outbox.js";
import type { AlertEventsService } from "../services/alertEvents.types.js";
import type { AlertRulesService } from "../services/alertRules.types.js";
import type { AlertSubscriptionsService } from "../services/alertSubscriptions.types.js";
import type { Clock, IdGenerator } from "../../utils/index.js";
import type { MonitoringSnapshotRecord } from "../../monitoring/entities/monitoringSnapshot.types.js";

export type ProcessMonitoringAlertsInput = {
    snapshot: MonitoringSnapshotRecord;
    previousSnapshot?: MonitoringSnapshotRecord | undefined;
};

export type ProcessMonitoringAlertsResult = {
    evaluated: number;
    triggered: number;
    resolved: number;
    skipped: number;
};

export type AlertEventsTx = {
    run<T>(cb: (deps: { alertEventsService: AlertEventsService; outbox: OutboxRepo }) => T): T;
};

export type ProcessMonitoringAlertsFlowDeps = {
    rulesService: AlertRulesService;
    subscriptionsService: AlertSubscriptionsService;
    eventsService: AlertEventsService;
    tx: AlertEventsTx;
    idGen: IdGenerator;
    clock: Clock;
};
