import pino from "pino";
import { createRotatingFileStream } from "./rotatingFileStream.js";

export type AppLogger = pino.Logger;

function shouldUsePretty(level: string): boolean {
    const nodeEnv = process.env["NODE_ENV"] ?? "";
    const isDev = nodeEnv === "development" || nodeEnv === "dev";
    if (!isDev || level === "silent") {
        return false;
    }

    const forced = process.env["LOG_PRETTY"];
    if (forced === "1" || forced === "true") {
        return true;
    }
    if (forced === "0" || forced === "false") {
        return false;
    }

    return Boolean(process.stdout.isTTY) && process.env["CI"] !== "true";
}

export function createLogger(input: { name: string; level: string }): AppLogger {
    const pretty = shouldUsePretty(input.level);
    return pino({
        name: input.name,
        level: input.level,
        timestamp: pino.stdTimeFunctions.isoTime,
        ...(pretty
            ? {
                transport: {
                    target: "pino-pretty",
                    options: {
                        colorize: true,
                        translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
                        ignore: "pid,hostname",
                        singleLine: false
                    }
                }
            }
            : {})
    });
}

export function createFileLogger(input: {
    name: string;
    level: string;
    filePath: string;
    maxBytes: number;
    retentionDays: number;
}): AppLogger {
    const stream = createRotatingFileStream({
        filePath: input.filePath,
        maxBytes: input.maxBytes,
        retentionDays: input.retentionDays
    });
    return pino(
        {
            name: input.name,
            level: input.level,
            timestamp: pino.stdTimeFunctions.isoTime
        },
        stream
    );
}

export function createRequestLogger(logger: AppLogger, bindings: Record<string, unknown>): AppLogger {
    return logger.child(bindings);
}
