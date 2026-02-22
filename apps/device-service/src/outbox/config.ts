import path from "node:path";
import { getDeviceDbFile, getDeviceOutboxConfig, loadEnv } from "@school-gate/config";

const envInfo = loadEnv();
const cfg = getDeviceOutboxConfig();
const dbFile = getDeviceDbFile();

export const DEVICE_DB_FILE = path.resolve(envInfo.baseDir, dbFile);
export const CORE_BASE_URL = cfg.coreBaseUrl;
export const CORE_TOKEN = cfg.coreToken;
export const CORE_HMAC_SECRET = cfg.coreHmacSecret;
export const DEVICE_OUTBOX_POLL_MS = cfg.pollMs;
export const DEVICE_OUTBOX_BATCH = cfg.batch;
export const DEVICE_OUTBOX_MAX_ATTEMPTS = cfg.maxAttempts;
export const DEVICE_OUTBOX_LEASE_MS = cfg.leaseMs;
export const DEVICE_OUTBOX_TIMEOUT_MS = cfg.timeoutMs;
export const DEVICE_OUTBOX_PROCESSING_BY = cfg.processingBy;
