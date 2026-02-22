import { z } from "zod";
import { parseEnv } from "./parseEnv.js";


const logLevelSchema = z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]);

const loggingSchema = z.object({
    LOG_DIR: z.string().min(1).default("data/logs"),
    LOG_MAX_BYTES: z.coerce.number().int().positive().default(100 * 1024 * 1024),
    LOG_RETENTION_DAYS: z.coerce.number().int().positive().default(7),
    LOG_LEVEL: logLevelSchema.default("info"),
});

export type LoggingConfig = {
    dir: string;
    maxBytes: number;
    retentionDays: number;
    level: z.infer<typeof logLevelSchema>;
};

export function getLoggingConfig(): LoggingConfig {
    const parsed = parseEnv(loggingSchema, "logging");
    return {
        dir: parsed.LOG_DIR,
        maxBytes: parsed.LOG_MAX_BYTES,
        retentionDays: parsed.LOG_RETENTION_DAYS,
        level: parsed.LOG_LEVEL,
    };
}
