import Mustache from "mustache";
import type { AccessNotification, NotificationSender } from "@school-gate/core";
import type { BotClient } from "./botClient.js";

type NotificationTemplateConfig = {
    parentTemplate: string;
    timeLocale?: string | undefined;
};

function formatTime(occurredAt: string, locale: string): string {
    const parsed = new Date(occurredAt);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Invalid occurredAt: ${occurredAt}`);
    }
    return parsed.toLocaleString(locale);
}

function buildTemplateView(input: AccessNotification, locale: string) {
    const firstName = input.firstName ?? "";
    const lastName = input.lastName ?? "";
    const fullName = [firstName, lastName].filter((part) => part.trim().length > 0).join(" ");

    return {
        accessEventId: input.accessEventId,
        deviceId: input.deviceId,
        personId: input.personId,
        direction: input.direction,
        directionWord: input.direction === "IN" ? "вошел" : "покинул",
        occurredAt: input.occurredAt,
        time: formatTime(input.occurredAt, locale),
        firstName,
        lastName,
        fullName,
        tgUserId: input.tgUserId
    };
}

export function renderParentNotification(template: string, input: AccessNotification, locale = "ru-RU"): string {
    const view = buildTemplateView(input, locale);
    return Mustache.render(template, view);
}

export function createBotNotificationSender(input: {
    botClient: BotClient;
    template: NotificationTemplateConfig;
}): NotificationSender {
    return {
        sendAccessEvent: async (payload) => {
            const text = renderParentNotification(
                input.template.parentTemplate,
                payload,
                input.template.timeLocale ?? "ru-RU"
            );
            await input.botClient.sendNotification({ tgUserId: payload.tgUserId, text });
        },
        sendAlert: async (payload) => {
            await input.botClient.sendNotification({ tgUserId: payload.tgUserId, text: payload.message });
        }
    };
}
