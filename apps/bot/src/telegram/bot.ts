import {
    AdminTgAlreadyLinkedError,
    AdminTgCodePurposeMismatchError,
    AdminTgLinkExpiredError,
    AdminTgLinkNotFoundError,
    AdminTgLinkUsedError,
    InvalidIinError,
    PendingRequestAlreadyExistsError,
    SubscriptionAccessDeniedError,
    SubscriptionNotFoundError
} from "@school-gate/core";
import { Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import type { AdminBotService } from "../application/adminBotService.js";
import type { ParentBotService } from "../application/parentBotService.js";
import { parseSubscriptionToggleCallbackData } from "./callbacks.js";
import { parseLinkCodeCommand } from "./commands.js";
import type { BotContext } from "./context.js";
import { menuButtons } from "./keyboards.js";
import { formatAdminMenuMessage, helpText } from "./messages.js";
import { createMenuKeyboard, getAdminAccess, renderDashboard, requirePrivate } from "./runtime.js";

type BotLogger = {
    info(input: object, msg: string): void;
    warn(input: object, msg: string): void;
    error(input: object, msg: string): void;
};

type CreateTelegramBotInput = {
    token: string;
    parentBotService: ParentBotService;
    adminBotService: AdminBotService;
    logger?: BotLogger | undefined;
};

export function createTelegramBot(input: CreateTelegramBotInput): Telegraf<BotContext> {
    const bot = new Telegraf<BotContext>(input.token);

    bot.use(session({ defaultSession: () => ({ awaitingIin: false, mode: "parent" as const }) }));

    bot.start(async (ctx) => {
        ctx.session.awaitingIin = false;
        const identity = await requirePrivate(ctx);
        if (!identity) return;

        const adminAccess = await getAdminAccess(ctx, input.adminBotService, identity);

        await ctx.reply(
            "Добро пожаловать. Используйте меню, чтобы управлять сценариями бота.",
            createMenuKeyboard(ctx, Boolean(adminAccess))
        );
    });

    bot.command("help", async (ctx) => {
        ctx.session.awaitingIin = false;
        const identity = await requirePrivate(ctx);
        if (!identity) return;

        const adminAccess = await getAdminAccess(ctx, input.adminBotService, identity);
        await ctx.reply(helpText(), createMenuKeyboard(ctx, Boolean(adminAccess)));
    });

    bot.command("link", async (ctx) => {
        ctx.session.awaitingIin = false;
        const identity = await requirePrivate(ctx);
        if (!identity) return;

        const code = parseLinkCodeCommand(ctx.message.text);
        const hasAdminAccessBeforeLink = Boolean(await getAdminAccess(ctx, input.adminBotService, identity));
        if (code === null || code.length === 0) {
            await ctx.reply("Используйте команду в формате: /link <код>", createMenuKeyboard(ctx, hasAdminAccessBeforeLink));
            return;
        }

        try {
            await input.adminBotService.linkTelegramByCode({
                tgUserId: identity.tgUserId,
                code
            });

            const adminAccess = await getAdminAccess(ctx, input.adminBotService, identity);
            ctx.session.mode = "admin";
            await ctx.reply(
                adminAccess
                    ? `Telegram привязан к admin ${adminAccess.email}.`
                    : "Telegram успешно привязан к админ-аккаунту.",
                createMenuKeyboard(ctx, true)
            );
        } catch (error) {
            if (
                error instanceof AdminTgLinkNotFoundError
                || error instanceof AdminTgLinkExpiredError
                || error instanceof AdminTgLinkUsedError
                || error instanceof AdminTgCodePurposeMismatchError
            ) {
                await ctx.reply("Код недействителен или уже использован.", createMenuKeyboard(ctx, hasAdminAccessBeforeLink));
                return;
            }

            if (error instanceof AdminTgAlreadyLinkedError) {
                await ctx.reply(
                    "Этот admin уже привязан к другому Telegram аккаунту.",
                    createMenuKeyboard(ctx, hasAdminAccessBeforeLink)
                );
                return;
            }

            input.logger?.error({ err: error }, "bot admin link failed");
            await ctx.reply("Не удалось выполнить привязку. Попробуйте позже.", createMenuKeyboard(ctx, hasAdminAccessBeforeLink));
        }
    });

    bot.hears(menuButtons.help, async (ctx) => {
        ctx.session.awaitingIin = false;
        const identity = await requirePrivate(ctx);
        if (!identity) return;

        const adminAccess = await getAdminAccess(ctx, input.adminBotService, identity);
        await ctx.reply(helpText(), createMenuKeyboard(ctx, Boolean(adminAccess)));
    });

    bot.hears(menuButtons.switchToAdmin, async (ctx) => {
        ctx.session.awaitingIin = false;
        const identity = await requirePrivate(ctx);
        if (!identity) return;

        const adminAccess = await getAdminAccess(ctx, input.adminBotService, identity);
        if (!adminAccess) {
            await ctx.reply("Админ-доступ не найден. Сначала выполните /link <код>.", createMenuKeyboard(ctx, false));
            return;
        }

        ctx.session.mode = "admin";
        await ctx.reply("Переключено в режим админа.", createMenuKeyboard(ctx, true));
    });

    bot.hears(menuButtons.switchToParent, async (ctx) => {
        ctx.session.awaitingIin = false;
        const identity = await requirePrivate(ctx);
        if (!identity) return;

        const adminAccess = await getAdminAccess(ctx, input.adminBotService, identity);
        ctx.session.mode = "parent";
        await ctx.reply("Переключено в режим родителя.", createMenuKeyboard(ctx, Boolean(adminAccess)));
    });

    bot.hears(menuButtons.adminMenu, async (ctx) => {
        ctx.session.awaitingIin = false;
        const identity = await requirePrivate(ctx);
        if (!identity) return;

        const adminAccess = await getAdminAccess(ctx, input.adminBotService, identity);
        if (!adminAccess) {
            await ctx.reply("Админ-доступ не найден. Сначала выполните /link <код>.", createMenuKeyboard(ctx, false));
            return;
        }

        ctx.session.mode = "admin";
        await ctx.reply(formatAdminMenuMessage(adminAccess), createMenuKeyboard(ctx, true));
    });

    bot.hears(menuButtons.newRequest, async (ctx) => {
        const identity = await requirePrivate(ctx);
        if (!identity) return;

        const adminAccess = await getAdminAccess(ctx, input.adminBotService, identity);
        ctx.session.mode = "parent";
        ctx.session.awaitingIin = true;
        await ctx.reply("Отправьте ИИН ученика (12 цифр).", createMenuKeyboard(ctx, Boolean(adminAccess)));
    });

    bot.hears(menuButtons.mySubscriptions, async (ctx) => {
        ctx.session.awaitingIin = false;
        const identity = await requirePrivate(ctx);
        if (!identity) return;

        await getAdminAccess(ctx, input.adminBotService, identity);
        ctx.session.mode = "parent";
        await renderDashboard(ctx, input.parentBotService, identity);
    });

    bot.on(message("text"), async (ctx) => {
        const identity = await requirePrivate(ctx);
        if (!identity) return;

        const text = ctx.message.text.trim();
        if (!ctx.session.awaitingIin) {
            if (!text.startsWith("/")) {
                const adminAccess = await getAdminAccess(ctx, input.adminBotService, identity);
                await ctx.reply("Выберите действие в меню.", createMenuKeyboard(ctx, Boolean(adminAccess)));
            }
            return;
        }

        try {
            const result = await input.parentBotService.requestSubscription({
                tgUserId: identity.tgUserId,
                chatId: identity.chatId,
                iin: text
            });

            const adminAccess = await getAdminAccess(ctx, input.adminBotService, identity);
            ctx.session.awaitingIin = false;
            await ctx.reply(
                `Заявка создана: ${result.requestId}. Статус: pending.`,
                createMenuKeyboard(ctx, Boolean(adminAccess))
            );
        } catch (error) {
            if (error instanceof InvalidIinError) {
                await ctx.reply("Некорректный ИИН. Введите 12 цифр.");
                return;
            }

            if (error instanceof PendingRequestAlreadyExistsError) {
                const adminAccess = await getAdminAccess(ctx, input.adminBotService, identity);
                ctx.session.awaitingIin = false;
                await ctx.reply(
                    "У вас уже есть заявка с таким ИИН в статусе pending.",
                    createMenuKeyboard(ctx, Boolean(adminAccess))
                );
                return;
            }

            const adminAccess = await getAdminAccess(ctx, input.adminBotService, identity);
            ctx.session.awaitingIin = false;
            input.logger?.error({ err: error }, "bot request subscription failed");
            await ctx.reply("Не удалось создать заявку. Попробуйте позже.", createMenuKeyboard(ctx, Boolean(adminAccess)));
        }
    });

    bot.action(/^sub:(on|off):(.+)$/, async (ctx) => {
        const identity = await requirePrivate(ctx);
        if (!identity) return;

        const data = "data" in ctx.callbackQuery ? ctx.callbackQuery.data : "";
        const parsed = parseSubscriptionToggleCallbackData(data);
        if (!parsed) {
            await ctx.answerCbQuery("Некорректное действие.");
            return;
        }

        try {
            const result = await input.parentBotService.setSubscriptionStatus({
                tgUserId: identity.tgUserId,
                subscriptionId: parsed.subscriptionId,
                isActive: parsed.isActive
            });
            await ctx.answerCbQuery(result.isActive ? "Подписка включена." : "Подписка отключена.");
            await renderDashboard(ctx, input.parentBotService, identity, { editMessage: true });
        } catch (error) {
            if (error instanceof SubscriptionNotFoundError) {
                await ctx.answerCbQuery("Подписка не найдена.");
                return;
            }
            if (error instanceof SubscriptionAccessDeniedError) {
                await ctx.answerCbQuery("Эта подписка вам не принадлежит.");
                return;
            }

            input.logger?.error({ err: error }, "bot toggle subscription failed");
            await ctx.answerCbQuery("Не удалось изменить подписку.");
        }
    });

    bot.catch((error, ctx) => {
        input.logger?.error({ err: error, updateId: ctx.update.update_id }, "telegram update failed");
    });

    return bot;
}
