import { z } from "zod";
import { parseEnv } from "./parseEnv.js";

const adapterMockSchema = z.object({
    DEVICE_SERVICE_BASE_URL: z.string().min(1).default("http://localhost:4010"),
    DEVICE_SERVICE_TOKEN: z.string().min(1),
    ADAPTER_MOCK_PORT: z.coerce.number().int().positive().default(4020),
    ADAPTER_MOCK_BASE_URL: z.string().min(1).default("http://localhost:4020"),
    ADAPTER_MOCK_VENDOR_KEY: z.string().min(1).default("mock"),
    ADAPTER_MOCK_INSTANCE_KEY: z.string().min(1).optional(),
    ADAPTER_MOCK_INSTANCE_NAME: z.string().min(1).optional(),
    ADAPTER_MOCK_VERSION: z.string().min(1).optional(),
    ADAPTER_MOCK_DB_FILE: z.string().min(1).default("./data/adapter-mock.db"),
    ADAPTER_MOCK_RETENTION_MS: z.coerce.number().int().positive().default(7 * 24 * 60 * 60 * 1000),
    ADAPTER_MOCK_RETENTION_SWEEP_MS: z.coerce.number().int().positive().default(60_000),
    ADAPTER_MOCK_EVENT_INTERVAL_MS: z.coerce.number().int().positive().default(5_000),
    ADAPTER_MOCK_PUSH_INTERVAL_MS: z.coerce.number().int().positive().default(1_000),
    ADAPTER_MOCK_BATCH_LIMIT: z.coerce.number().int().positive().default(200)
});

export function getAdapterMockConfig() {
    const parsed = parseEnv(adapterMockSchema, "adapter mock");
    return {
        deviceServiceBaseUrl: parsed.DEVICE_SERVICE_BASE_URL,
        deviceServiceToken: parsed.DEVICE_SERVICE_TOKEN,
        port: parsed.ADAPTER_MOCK_PORT,
        baseUrl: parsed.ADAPTER_MOCK_BASE_URL,
        vendorKey: parsed.ADAPTER_MOCK_VENDOR_KEY,
        instanceKey: parsed.ADAPTER_MOCK_INSTANCE_KEY,
        instanceName: parsed.ADAPTER_MOCK_INSTANCE_NAME,
        version: parsed.ADAPTER_MOCK_VERSION,
        dbFile: parsed.ADAPTER_MOCK_DB_FILE,
        retentionMs: parsed.ADAPTER_MOCK_RETENTION_MS,
        retentionSweepMs: parsed.ADAPTER_MOCK_RETENTION_SWEEP_MS,
        eventIntervalMs: parsed.ADAPTER_MOCK_EVENT_INTERVAL_MS,
        pushIntervalMs: parsed.ADAPTER_MOCK_PUSH_INTERVAL_MS,
        batchLimit: parsed.ADAPTER_MOCK_BATCH_LIMIT
    };
}
