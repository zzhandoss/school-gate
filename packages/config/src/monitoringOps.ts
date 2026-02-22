import { z } from "zod";
import { parseEnv } from "./parseEnv.js";


const urlSchema = z.url();

const monitoringOpsSchema = z.object({
    MONITORING_SNAPSHOT_INTERVAL_MS: z.coerce.number().int().positive().default(60_000),
    MONITORING_SNAPSHOT_RETENTION_DAYS: z.coerce.number().int().positive().default(7),
    MONITORING_HTTP_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
    MONITORING_API_URL: urlSchema.default("http://localhost:3000"),
    MONITORING_DEVICE_SERVICE_URL: urlSchema.default("http://localhost:4010"),
    MONITORING_BOT_URL: urlSchema.default("http://localhost:4100"),
    DEVICE_SERVICE_INTERNAL_TOKEN: z.string().min(1),
    MONITORING_DEVICE_TTL_MS: z.coerce.number().int().positive().default(5 * 60 * 1000)
});

export type MonitoringOpsConfig = {
    snapshotIntervalMs: number;
    snapshotRetentionDays: number;
    httpTimeoutMs: number;
    apiUrl: string;
    deviceServiceUrl: string;
    botUrl: string;
    deviceServiceToken: string;
    deviceTtlMs: number;
};

export function getMonitoringOpsConfig(): MonitoringOpsConfig {
    const parsed = parseEnv(monitoringOpsSchema, "monitoringOps");
    return {
        snapshotIntervalMs: parsed.MONITORING_SNAPSHOT_INTERVAL_MS,
        snapshotRetentionDays: parsed.MONITORING_SNAPSHOT_RETENTION_DAYS,
        httpTimeoutMs: parsed.MONITORING_HTTP_TIMEOUT_MS,
        apiUrl: parsed.MONITORING_API_URL,
        deviceServiceUrl: parsed.MONITORING_DEVICE_SERVICE_URL,
        botUrl: parsed.MONITORING_BOT_URL,
        deviceServiceToken: parsed.DEVICE_SERVICE_INTERNAL_TOKEN,
        deviceTtlMs: parsed.MONITORING_DEVICE_TTL_MS
    };
}
