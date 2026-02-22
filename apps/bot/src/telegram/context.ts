import type { Context } from "telegraf";

export type BotMode = "parent" | "admin";

export type BotSession = {
    awaitingIin: boolean;
    mode: BotMode;
};

export type BotContext = Context & {
    session: BotSession;
};

export type PrivateIdentity = {
    tgUserId: string;
    chatId: string;
};
