import type { AlertSeverity } from "./alertRules.types.js";

export type AlertEventStatus = "triggered" | "resolved";

export type AlertEventDetails = Record<string, unknown>;

export type AlertEvent = {
    id: string;
    ruleId: string;
    snapshotId: string | null;
    status: AlertEventStatus;
    severity: AlertSeverity;
    message: string;
    details: AlertEventDetails | null;
    createdAt: Date;
};
