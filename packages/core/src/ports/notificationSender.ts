import type { AlertNotification } from "../alerts/index.js";

export type AccessNotification = {
    accessEventId: string;
    deviceId: string;
    direction: "IN" | "OUT";
    occurredAt: string;
    personId: string;
    firstName?: string | null | undefined;
    lastName?: string | null | undefined;
    tgUserId: string;
};

export interface NotificationSender {
    sendAccessEvent(input: AccessNotification): Promise<void>;
    sendAlert(input: AlertNotification): Promise<void>;
}
