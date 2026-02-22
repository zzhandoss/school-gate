import type { AdminBotService } from "../application/adminBotService.js";
import type { ParentBotService } from "../application/parentBotService.js";
import type { BotContext, PrivateIdentity } from "./context.js";
import { createMainMenuKeyboard, createSubscriptionActionsKeyboard } from "./keyboards.js";
import { formatDashboardMessage } from "./messages.js";

function toPrivateIdentity(ctx: BotContext): PrivateIdentity | null {
    if (!ctx.from) return null;
    if (!ctx.chat || ctx.chat.type !== "private") return null;

    return {
        tgUserId: String(ctx.from.id),
        chatId: String(ctx.chat.id)
    };
}

export function createMenuKeyboard(ctx: BotContext, hasAdminAccess: boolean) {
    return createMainMenuKeyboard({
        mode: ctx.session.mode,
        hasAdminAccess
    });
}

export async function getAdminAccess(ctx: BotContext, adminBotService: AdminBotService, identity: PrivateIdentity) {
    const adminAccess = await adminBotService.getAccess({ tgUserId: identity.tgUserId });
    if (!adminAccess && ctx.session.mode === "admin") {
        ctx.session.mode = "parent";
    }
    return adminAccess;
}

export async function renderDashboard(
    ctx: BotContext,
    parentBotService: ParentBotService,
    identity: PrivateIdentity,
    options?: { editMessage?: boolean | undefined }
) {
    const view = await parentBotService.getDashboard({ tgUserId: identity.tgUserId });
    const text = formatDashboardMessage(view);
    const keyboard = view.subscriptions.length > 0
        ? createSubscriptionActionsKeyboard({ subscriptions: view.subscriptions })
        : undefined;

    if (options?.editMessage) {
        try {
            if (keyboard) {
                await ctx.editMessageText(text, keyboard);
            } else {
                await ctx.editMessageText(text);
            }
            return;
        } catch {
            return;
        }
    }

    if (keyboard) {
        await ctx.reply(text, keyboard);
        return;
    }

    await ctx.reply(text);
}

export async function requirePrivate(ctx: BotContext): Promise<PrivateIdentity | null> {
    const identity = toPrivateIdentity(ctx);
    if (identity) return identity;

    if ("callback_query" in ctx.update) {
        await ctx.answerCbQuery("Доступно только в личном чате.");
        return null;
    }

    await ctx.reply("Эта функция доступна только в личном чате с ботом.");
    return null;
}
