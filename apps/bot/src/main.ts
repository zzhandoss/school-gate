import path from "node:path";
import crypto from "node:crypto";
import { serve } from "@hono/node-server";
import { createDb } from "@school-gate/db/drizzle";
import { getBotServiceConfig, getCoreDbFile, getLoggingConfig, loadEnv } from "@school-gate/config";
import { createFileLogger, createLogger } from "@school-gate/infra";
import { createBotApp } from "./app.js";
import { createBotComposition } from "./composition/createBotComposition.js";
import { createTelegramBot } from "./telegram/bot.js";
import { createTelegramClient } from "./telegramClient.js";

const envInfo = loadEnv();
const loggingConfig = getLoggingConfig();
const isDev = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev";
const logger = isDev
    ? createLogger({
        name: "bot-api",
        level: loggingConfig.level
    })
    : createFileLogger({
        name: "bot-api",
        level: loggingConfig.level,
        filePath: path.join(loggingConfig.dir, "bot-api.log"),
        maxBytes: loggingConfig.maxBytes,
        retentionDays: loggingConfig.retentionDays
    });

const config = getBotServiceConfig();
const dbFile = getCoreDbFile();
const dbFilePath = path.resolve(envInfo.baseDir, dbFile);
const dbClient = createDb(dbFilePath);
const composition = createBotComposition({
    db: dbClient.db,
    idGen: { nextId: () => crypto.randomUUID() },
    clock: { now: () => new Date() }
});
const bot = createTelegramBot({
    token: config.telegramToken,
    parentBotService: composition.parentBotService,
    adminBotService: composition.adminBotService,
    logger
});
const telegram = createTelegramClient(config.telegramToken);
const app = createBotApp({
    config: { internalToken: config.internalToken },
    telegram
});

const server = serve(
    {
        fetch: app.fetch,
        port: config.port
    },
    (info) => {
        logger.info({ port: info.port }, "bot api started");
    }
);

bot.launch()
    .then(() => {
        logger.info({}, "telegram polling started");
    })
    .catch((error) => {
        logger.error({ err: error }, "telegram polling failed");
        process.exitCode = 1;
    });

const close = () => {
    server.close();
    bot.stop("shutdown");
    dbClient.close();
};

process.on("SIGINT", close);
process.on("SIGTERM", close);
