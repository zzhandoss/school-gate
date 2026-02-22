import { Markup } from "telegraf";
import type { BotMode } from "./context.js";
import { formatSubscriptionToggleCallbackData } from "./callbacks.js";

export const menuButtons = {
    newRequest: "➕ Новая заявка",
    mySubscriptions: "📄 Мои подписки",
    adminMenu: "⚙️ Админ меню",
    switchToParent: "👪 Режим родителя",
    switchToAdmin: "🛡 Режим админа",
    help: "ℹ️ Помощь"
} as const;

export function createMainMenuKeyboard(input: {
    mode: BotMode;
    hasAdminAccess: boolean;
}) {
    const rows: string[][] = [];

    if (input.mode === "admin") {
        rows.push([menuButtons.adminMenu]);
    } else {
        rows.push([menuButtons.newRequest, menuButtons.mySubscriptions]);
    }

    if (input.hasAdminAccess) {
        rows.push([input.mode === "admin" ? menuButtons.switchToParent : menuButtons.switchToAdmin]);
    }

    rows.push([menuButtons.help]);

    return Markup.keyboard(rows).resize();
}

export function createSubscriptionActionsKeyboard(input: {
    subscriptions: Array<{
        id: string;
        isActive: boolean;
        person: { iin: string; firstName: string | null; lastName: string | null };
    }>;
}) {
    const rows = input.subscriptions.map((item) => {
        const fullName = [item.person.firstName, item.person.lastName]
            .filter((part) => Boolean(part && part.trim().length > 0))
            .join(" ");
        const label = fullName.length > 0 ? fullName : item.person.iin;
        const toggleText = item.isActive ? "⏸ Отключить" : "▶️ Включить";

        return [
            Markup.button.callback(
                `${toggleText}: ${label}`,
                formatSubscriptionToggleCallbackData({
                    subscriptionId: item.id,
                    isActive: !item.isActive
                })
            )
        ];
    });

    return Markup.inlineKeyboard(rows);
}
