import { auditRequestedHandler, auditRequestedHandlerType } from "./auditRequested.handler.js";
import { parentNotificationRequestedHandler, parentNotificationRequestedHandlerType } from "./parentNotificationRequested.handler.js";
import { alertNotificationRequestedHandler, alertNotificationRequestedHandlerType } from "./alertNotificationRequested.handler.js";

export const outboxHandlers = {
    [auditRequestedHandlerType]: auditRequestedHandler,
    [parentNotificationRequestedHandlerType]: parentNotificationRequestedHandler,
    [alertNotificationRequestedHandlerType]: alertNotificationRequestedHandler
} as const;
