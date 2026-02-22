import os from "node:os";
import { z } from "zod";
import { parseEnv } from "./parseEnv.js";
import { DEFAULT_CORS_ORIGIN, parseCorsAllowedOrigins } from "./cors.js";

const processingByDefault = `${os.hostname()}:${process.pid}`;
const optionalNonEmptyString = z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(1).optional()
);

const deviceDbSchema = z.object({
    DEVICE_DB_FILE: z.string().min(1).default("./data/device.db")
});

const deviceOutboxSchema = z.object({
    CORE_BASE_URL: z.string().min(1),
    CORE_TOKEN: z.string().min(1),
    CORE_HMAC_SECRET: z.string().min(1),
    DEVICE_OUTBOX_POLL_MS: z.coerce.number().int().positive().default(1_000),
    DEVICE_OUTBOX_BATCH: z.coerce.number().int().positive().default(50),
    DEVICE_OUTBOX_MAX_ATTEMPTS: z.coerce.number().int().positive().default(10),
    DEVICE_OUTBOX_LEASE_MS: z.coerce.number().int().positive().default(60_000),
    DEVICE_OUTBOX_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
    DEVICE_OUTBOX_PROCESSING_BY: optionalNonEmptyString
});

const deviceServiceSchema = z.object({
    DEVICE_SERVICE_PORT: z.coerce.number().int().positive().default(4010),
    DEVICE_SERVICE_CORS_ALLOWED_ORIGINS: z.string().default(DEFAULT_CORS_ORIGIN),
    DEVICE_SERVICE_TOKEN: z.string().min(1),
    DEVICE_SERVICE_INTERNAL_TOKEN: z.string().min(1),
    DEVICE_ADAPTER_HEARTBEAT_MS: z.coerce.number().int().positive().default(30_000),
    DEVICE_ADAPTER_BATCH_LIMIT: z.coerce.number().int().positive().default(500),
    DEVICE_MONITORING_DEVICE_TTL_MS: z.coerce.number().int().positive().default(5 * 60 * 1000),
    ADMIN_JWT_SECRET: z.string().min(32)
});

export function getDeviceDbFile(): string {
    return parseEnv(deviceDbSchema, "device db").DEVICE_DB_FILE;
}

export function getDeviceOutboxConfig() {
    const parsed = parseEnv(deviceOutboxSchema, "device outbox");
    return {
        coreBaseUrl: parsed.CORE_BASE_URL,
        coreToken: parsed.CORE_TOKEN,
        coreHmacSecret: parsed.CORE_HMAC_SECRET,
        pollMs: parsed.DEVICE_OUTBOX_POLL_MS,
        batch: parsed.DEVICE_OUTBOX_BATCH,
        maxAttempts: parsed.DEVICE_OUTBOX_MAX_ATTEMPTS,
        leaseMs: parsed.DEVICE_OUTBOX_LEASE_MS,
        timeoutMs: parsed.DEVICE_OUTBOX_TIMEOUT_MS,
        processingBy: parsed.DEVICE_OUTBOX_PROCESSING_BY ?? processingByDefault
    };
}

export function getDeviceServiceConfig() {
    const parsed = parseEnv(deviceServiceSchema, "device service");
    return {
        port: parsed.DEVICE_SERVICE_PORT,
        corsAllowedOrigins: parseCorsAllowedOrigins(
            parsed.DEVICE_SERVICE_CORS_ALLOWED_ORIGINS,
            "DEVICE_SERVICE_CORS_ALLOWED_ORIGINS"
        ),
        token: parsed.DEVICE_SERVICE_TOKEN,
        internalToken: parsed.DEVICE_SERVICE_INTERNAL_TOKEN,
        heartbeatIntervalMs: parsed.DEVICE_ADAPTER_HEARTBEAT_MS,
        batchLimit: parsed.DEVICE_ADAPTER_BATCH_LIMIT,
        deviceTtlMs: parsed.DEVICE_MONITORING_DEVICE_TTL_MS,
        adminJwtSecret: parsed.ADMIN_JWT_SECRET
    };
}
