import type { AlertEventStatus } from "./alertEvents.types.js";
import type { AlertSeverity } from "./alertRules.types.js";

export type AlertNotification = {
    alertEventId: string;
    ruleId: string;
    ruleName: string;
    severity: AlertSeverity;
    status: AlertEventStatus;
    message: string;
    createdAt: string;
    tgUserId: string;
};
