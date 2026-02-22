import { z } from "zod";
import { parseEnv } from "./parseEnv.js";
import { DEFAULT_CORS_ORIGIN, parseCorsAllowedOrigins } from "./cors.js";

const logLevelSchema = z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]);

const apiSchema = z.object({
    API_PORT: z.coerce.number().int().positive().default(3000),
    API_CORS_ALLOWED_ORIGINS: z.string().default(DEFAULT_CORS_ORIGIN),
    API_AUTH_ACCESS_COOKIE_NAME: z.string().min(1).default("sg_admin_access"),
    API_AUTH_REFRESH_COOKIE_NAME: z.string().min(1).default("sg_admin_refresh"),
    API_AUTH_COOKIE_PATH: z.string().min(1).default("/"),
    API_AUTH_COOKIE_SECURE: z.coerce.boolean().default(false),
    API_AUTH_COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).default("lax"),
    LOG_LEVEL: logLevelSchema.default("info"),
    LOG_NAME: z.string().min(1).default("api"),
    CORE_TOKEN: z.string().min(1),
    CORE_HMAC_SECRET: z.string().min(1),
    CORE_HMAC_WINDOW_MS: z.coerce.number().int().positive().default(5 * 60_000),
    ACCESS_EVENTS_INLINE_MAX_IN_FLIGHT: z.coerce.number().int().positive().default(5),
    ADMIN_JWT_SECRET: z.string().min(32),
    ADMIN_JWT_TTL_MS: z.coerce.number().int().positive().default(12 * 60 * 60 * 1000),
    ADMIN_REFRESH_TTL_MS: z.coerce.number().int().positive().default(30 * 24 * 60 * 60 * 1000)
});

export type ApiConfig = {
    port: number;
    corsAllowedOrigins: string[];
    authAccessCookieName: string;
    authRefreshCookieName: string;
    authCookiePath: string;
    authCookieSecure: boolean;
    authCookieSameSite: "strict" | "lax" | "none";
    logLevel: z.infer<typeof logLevelSchema>;
    logName: string;
    coreToken: string;
    coreHmacSecret: string;
    coreHmacWindowMs: number;
    accessEventsInlineMaxInFlight: number;
    adminJwtSecret: string;
    adminJwtTtlMs: number;
    adminRefreshTtlMs: number;
};

export function getApiConfig(): ApiConfig {
    const parsed = parseEnv(apiSchema, "api");
    return {
        port: parsed.API_PORT,
        corsAllowedOrigins: parseCorsAllowedOrigins(parsed.API_CORS_ALLOWED_ORIGINS, "API_CORS_ALLOWED_ORIGINS"),
        authAccessCookieName: parsed.API_AUTH_ACCESS_COOKIE_NAME,
        authRefreshCookieName: parsed.API_AUTH_REFRESH_COOKIE_NAME,
        authCookiePath: parsed.API_AUTH_COOKIE_PATH,
        authCookieSecure: parsed.API_AUTH_COOKIE_SECURE,
        authCookieSameSite: parsed.API_AUTH_COOKIE_SAME_SITE,
        logLevel: parsed.LOG_LEVEL,
        logName: parsed.LOG_NAME,
        coreToken: parsed.CORE_TOKEN,
        coreHmacSecret: parsed.CORE_HMAC_SECRET,
        coreHmacWindowMs: parsed.CORE_HMAC_WINDOW_MS,
        accessEventsInlineMaxInFlight: parsed.ACCESS_EVENTS_INLINE_MAX_IN_FLIGHT,
        adminJwtSecret: parsed.ADMIN_JWT_SECRET,
        adminJwtTtlMs: parsed.ADMIN_JWT_TTL_MS,
        adminRefreshTtlMs: parsed.ADMIN_REFRESH_TTL_MS
    };
}
