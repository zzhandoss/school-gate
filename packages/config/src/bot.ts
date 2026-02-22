import { z } from "zod";
import { parseEnv } from "./parseEnv.js";

const baseSchema = z.object({
    BOT_API_PORT: z.coerce.number().int().positive().default(4100),
    BOT_INTERNAL_TOKEN: z.string().min(1)
});

const serviceSchema = baseSchema.extend({
    TELEGRAM_BOT_TOKEN: z.string().min(1)
});

const optionalUrl = z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().url().optional()
);

const clientSchema = baseSchema.extend({
    BOT_INTERNAL_URL: optionalUrl
});

export type BotServiceConfig = {
    port: number;
    internalToken: string;
    telegramToken: string;
};

export type BotClientConfig = {
    baseUrl: string;
    internalToken: string;
};

export function getBotServiceConfig(): BotServiceConfig {
    const parsed = parseEnv(serviceSchema, "bot service");
    return {
        port: parsed.BOT_API_PORT,
        internalToken: parsed.BOT_INTERNAL_TOKEN,
        telegramToken: parsed.TELEGRAM_BOT_TOKEN
    };
}

export function getBotClientConfig(): BotClientConfig {
    const parsed = parseEnv(clientSchema, "bot client");
    return {
        baseUrl: parsed.BOT_INTERNAL_URL ?? `http://localhost:${parsed.BOT_API_PORT}`,
        internalToken: parsed.BOT_INTERNAL_TOKEN
    };
}
