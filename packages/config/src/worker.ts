import os from "node:os";
import { z } from "zod";
import { parseEnv } from "./parseEnv.js";
import type {
    AccessEventsWorkerConfig,
    OutboxWorkerConfig,
    RetentionWorkerConfig,
    WorkerConfig
} from "@school-gate/core";

const processingByDefault = `${os.hostname()}:${process.pid}`;
const optionalNonEmptyString = z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(1).optional()
);

const coreDbSchema = z.object({
    DB_FILE: z.string().min(1).default("./data/app.db")
});

const workerSchema = z.object({
    WORKER_POLL_MS: z.coerce.number().int().positive().default(3_000),
    WORKER_BATCH: z.coerce.number().int().positive().default(20),
    FEATURE_AUTO_RESOLVE_PERSON: z.enum(["true", "false"]).default("false")
});

const outboxWorkerSchema = z.object({
    OUTBOX_POLL_MS: z.coerce.number().int().positive().default(1_000),
    OUTBOX_BATCH: z.coerce.number().int().positive().default(50),
    OUTBOX_MAX_ATTEMPTS: z.coerce.number().int().positive().default(10),
    OUTBOX_LEASE_MS: z.coerce.number().int().positive().default(60_000),
    OUTBOX_PROCESSING_BY: optionalNonEmptyString
});

const accessEventsWorkerSchema = z.object({
    ACCESS_EVENTS_POLL_MS: z.coerce.number().int().positive().default(1_000),
    ACCESS_EVENTS_BATCH: z.coerce.number().int().positive().default(50),
    ACCESS_EVENTS_RETRY_DELAY_MS: z.coerce.number().int().positive().default(5_000),
    ACCESS_EVENTS_LEASE_MS: z.coerce.number().int().positive().default(60_000),
    ACCESS_EVENTS_MAX_ATTEMPTS: z.coerce.number().int().positive().default(10),
    ACCESS_EVENTS_PROCESSING_BY: optionalNonEmptyString
});

const retentionWorkerSchema = z.object({
    RETENTION_POLL_MS: z.coerce.number().int().positive().default(300_000),
    RETENTION_BATCH: z.coerce.number().int().positive().default(500),
    RETENTION_ACCESS_EVENTS_DAYS: z.coerce.number().int().positive().default(30),
    RETENTION_AUDIT_LOGS_DAYS: z.coerce.number().int().positive().default(30)
});

function applyOverrides<T extends Record<string, unknown>>(base: T, overrides?: Partial<T>): T {
    if (!overrides) return base;
    const merged: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(overrides)) {
        if (value !== undefined) {
            merged[key] = value;
        }
    }
    return merged as T;
}

export function getCoreDbFile(): string {
    return parseEnv(coreDbSchema, "core db").DB_FILE;
}

export function getWorkerConfig(overrides?: Partial<WorkerConfig>): WorkerConfig {
    const parsed = parseEnv(workerSchema, "worker");
    const base: WorkerConfig = {
        pollMs: parsed.WORKER_POLL_MS,
        batch: parsed.WORKER_BATCH,
        autoResolvePersonByIin: parsed.FEATURE_AUTO_RESOLVE_PERSON === "true"
    };
    return applyOverrides(base, overrides);
}

export function getOutboxWorkerConfig(overrides?: Partial<OutboxWorkerConfig>): OutboxWorkerConfig {
    const parsed = parseEnv(outboxWorkerSchema, "outbox worker");
    const base: OutboxWorkerConfig = {
        pollMs: parsed.OUTBOX_POLL_MS,
        batch: parsed.OUTBOX_BATCH,
        maxAttempts: parsed.OUTBOX_MAX_ATTEMPTS,
        leaseMs: parsed.OUTBOX_LEASE_MS,
        processingBy: parsed.OUTBOX_PROCESSING_BY ?? processingByDefault
    };
    return applyOverrides(base, overrides);
}

export function getAccessEventsWorkerConfig(
    overrides?: Partial<AccessEventsWorkerConfig>
): AccessEventsWorkerConfig {
    const parsed = parseEnv(accessEventsWorkerSchema, "access events worker");
    const base: AccessEventsWorkerConfig = {
        pollMs: parsed.ACCESS_EVENTS_POLL_MS,
        batch: parsed.ACCESS_EVENTS_BATCH,
        retryDelayMs: parsed.ACCESS_EVENTS_RETRY_DELAY_MS,
        leaseMs: parsed.ACCESS_EVENTS_LEASE_MS,
        maxAttempts: parsed.ACCESS_EVENTS_MAX_ATTEMPTS,
        processingBy: parsed.ACCESS_EVENTS_PROCESSING_BY ?? processingByDefault
    };
    return applyOverrides(base, overrides);
}

export function getRetentionWorkerConfig(overrides?: Partial<RetentionWorkerConfig>): RetentionWorkerConfig {
    const parsed = parseEnv(retentionWorkerSchema, "retention worker");
    const base: RetentionWorkerConfig = {
        pollMs: parsed.RETENTION_POLL_MS,
        batch: parsed.RETENTION_BATCH,
        accessEventsDays: parsed.RETENTION_ACCESS_EVENTS_DAYS,
        auditLogsDays: parsed.RETENTION_AUDIT_LOGS_DAYS
    };
    return applyOverrides(base, overrides);
}
