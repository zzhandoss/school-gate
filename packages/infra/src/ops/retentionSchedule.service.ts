import { spawnSync } from "node:child_process";
import path from "node:path";
import { getRetentionWorkerConfig, loadEnv } from "@school-gate/config";
import type { Db } from "@school-gate/db/drizzle";
import { createAccessEventsRetentionRepo } from "../drizzle/repos/accessEventsRetention.repo.js";
import { createAuditLogsRetentionRepo } from "../drizzle/repos/auditLogsRetention.repo.js";
import { createSettingsRepo } from "../drizzle/repos/settings.repo.js";
import { createWorkerHeartbeatsRepo } from "../drizzle/repos/workerHeartbeats.repo.js";
import type {
    AccessEventsRetentionRepo,
    AuditLogsRetentionRepo, Clock } from "@school-gate/core";
import {
    createAccessEventsRetentionService, createAuditLogsRetentionService,
    createCleanupRetentionFlow, createSettingsService
} from "@school-gate/core";
import { createRuntimeConfigProvider } from "../config/runtimeConfigProvider.js";

const TASK_NAME = "school-gate-retention";
const CRON_MARKER = "# school-gate-retention";
const RUN_ONCE_ENTRY = "apps/worker/src/retention/runOnce.ts";

type CommandResult = {
    status: number | null;
    stdout: string;
    stderr: string;
    error?: Error;
};

export type ApplyRetentionScheduleResult = {
    taskName: string;
    platform: NodeJS.Platform;
    pollMs: number;
    intervalMinutes: number;
};

export type RemoveRetentionScheduleResult = {
    taskName: string;
    platform: NodeJS.Platform;
    removed: boolean;
};

export type RunRetentionOnceResult = {
    accessEventsDeleted: number;
    auditLogsDeleted: number;
    accessEventsCutoff: Date;
    auditLogsCutoff: Date;
    batch: number;
    accessEventsDays: number;
    auditLogsDays: number;
};

function run(command: string, args: string[], options?: { input?: string }): CommandResult {
    const res = spawnSync(command, args, {
        encoding: "utf8",
        input: options?.input
    });
    const base: CommandResult = {
        status: res.status,
        stdout: res.stdout ?? "",
        stderr: res.stderr ?? ""
    };
    if (res.error) {
        base.error = res.error;
    }
    return base;
}

function intervalMinutesFromPollMs(pollMs: number): number {
    const minutes = Math.ceil(pollMs / 60_000);
    return Math.max(1, minutes);
}

function cronFromIntervalMinutes(intervalMinutes: number): string {
    if (intervalMinutes < 60) {
        return `*/${intervalMinutes} * * * *`;
    }

    const hours = Math.max(1, Math.ceil(intervalMinutes / 60));
    if (hours < 24) {
        return `0 */${hours} * * *`;
    }

    const days = Math.max(1, Math.ceil(hours / 24));
    return `0 0 */${days} * *`;
}

function ensureSuccess(result: CommandResult, label: string, fallback?: CommandResult): void {
    if (result.error) {
        throw new Error(`${label}: ${result.error.message}`);
    }
    if (result.status !== 0) {
        const detail = result.stderr.trim() || fallback?.stderr.trim() || "unknown error";
        throw new Error(`${label}: ${detail}`);
    }
}

function applyWindowsSchedule(cwd: string, intervalMinutes: number) {
    const cdCmd = `cd /d "${cwd}"`;
    const runCmd = `pnpm exec tsx ${RUN_ONCE_ENTRY}`;
    const taskCommand = `cmd /d /s /c "${cdCmd} && ${runCmd}"`;

    const result = run("schtasks", [
        "/Create",
        "/TN",
        TASK_NAME,
        "/SC",
        "MINUTE",
        "/MO",
        String(intervalMinutes),
        "/TR",
        taskCommand,
        "/F"
    ]);

    ensureSuccess(result, "Failed to apply Windows schedule");
}

function applyLinuxCronSchedule(cwd: string, intervalMinutes: number) {
    const cronExpr = cronFromIntervalMinutes(intervalMinutes);
    const cronCommand = `cd "${cwd}" && pnpm exec tsx ${RUN_ONCE_ENTRY}`;
    const cronLine = `${cronExpr} ${cronCommand} ${CRON_MARKER}`;

    const current = run("crontab", ["-l"]);
    const hasCrontab = current.status === 0;
    const currentLines = hasCrontab ? current.stdout.split(/\r?\n/) : [];

    const filtered = currentLines.filter((line) => line.trim() !== "" && !line.includes(CRON_MARKER));
    filtered.push(cronLine);

    const nextContent = `${filtered.join("\n")}\n`;
    const applied = run("crontab", ["-"], { input: nextContent });

    ensureSuccess(applied, "Failed to apply Linux schedule", current);
}

function isMissingWindowsTask(result: CommandResult): boolean {
    const text = `${result.stdout}\n${result.stderr}`.toLowerCase();
    return text.includes("cannot find") || text.includes("cannot find the file") || text.includes("cannot find the path");
}

function removeWindowsSchedule(): boolean {
    const result = run("schtasks", [
        "/Delete",
        "/TN",
        TASK_NAME,
        "/F"
    ]);

    if (result.error) {
        throw new Error(`Failed to remove Windows schedule: ${result.error.message}`);
    }
    if (result.status === 0) return true;
    if (isMissingWindowsTask(result)) return false;
    const detail = result.stderr.trim() || result.stdout.trim() || "unknown error";
    throw new Error(`Failed to remove Windows schedule: ${detail}`);
}

function removeLinuxCronSchedule(): boolean {
    const current = run("crontab", ["-l"]);
    const hasCrontab = current.status === 0;
    const currentLines = hasCrontab ? current.stdout.split(/\r?\n/) : [];
    const hasMarker = currentLines.some((line) => line.includes(CRON_MARKER));
    if (!hasMarker) return false;

    const filtered = currentLines.filter((line) => line.trim() !== "" && !line.includes(CRON_MARKER));
    const nextContent = `${filtered.join("\n")}\n`;
    const applied = run("crontab", ["-"], { input: nextContent });
    ensureSuccess(applied, "Failed to remove Linux schedule", current);
    return true;
}

function resolveRetentionConfig(db: Db, clock: Clock) {
    loadEnv();
    const settingsRepo = createSettingsRepo(db);
    const settingsService = createSettingsService({
        settingsRepo,
        clock,
        runtimeConfigProvider: createRuntimeConfigProvider()
    });
    const overrides = settingsService.getRuntimeSettings();
    return getRetentionWorkerConfig(overrides.retention);
}

export function applyRetentionSchedule(
    db: Db,
    input: { cwd?: string; platform?: NodeJS.Platform, clock: Clock }
): ApplyRetentionScheduleResult {
    const retentionCfg = resolveRetentionConfig(db, input.clock);
    const intervalMinutes = intervalMinutesFromPollMs(retentionCfg.pollMs);
    const platform = input?.platform ?? process.platform;
    const cwd = path.resolve(input?.cwd ?? process.cwd());

    if (platform === "win32") {
        applyWindowsSchedule(cwd, intervalMinutes);
    } else {
        applyLinuxCronSchedule(cwd, intervalMinutes);
    }

    return {
        taskName: TASK_NAME,
        platform,
        pollMs: retentionCfg.pollMs,
        intervalMinutes
    };
}

export function removeRetentionSchedule(
    db: Db,
    input: { platform?: NodeJS.Platform, clock: Clock }
): RemoveRetentionScheduleResult {
    // Resolve config to ensure env/settings are valid and consistent with apply path.
    resolveRetentionConfig(db, input.clock);

    const platform = input?.platform ?? process.platform;
    const removed = platform === "win32" ? removeWindowsSchedule() : removeLinuxCronSchedule();

    return {
        taskName: TASK_NAME,
        platform,
        removed
    };
}

const cleanUpRetention = (eventsRetentionRepo: AccessEventsRetentionRepo, auditLogsRepo: AuditLogsRetentionRepo) => {
    const accessEventsRetentionService = createAccessEventsRetentionService({ accessEventsRetentionRepo: eventsRetentionRepo });
    const auditLogsRetentionService = createAuditLogsRetentionService({ auditLogsRetentionRepo: auditLogsRepo });
    return createCleanupRetentionFlow({
        accessEventsRetentionService,
        auditLogsRetentionService
    });
};

export async function runRetentionOnce(db: Db, clock: Clock): Promise<RunRetentionOnceResult> {
    const retentionCfg = resolveRetentionConfig(db, clock);
    const cleanupRetention = cleanUpRetention(
        createAccessEventsRetentionRepo(db),
        createAuditLogsRetentionRepo(db)
    );
    const heartbeats = createWorkerHeartbeatsRepo(db);
    const startedAt = new Date();
    heartbeats.startSync({
        workerId: "retention",
        at: startedAt,
        meta: { mode: "run-once" }
    });

    try {
        const result = await cleanupRetention({
            now: startedAt,
            batch: retentionCfg.batch,
            accessEventsDays: retentionCfg.accessEventsDays,
            auditLogsDays: retentionCfg.auditLogsDays
        });
        heartbeats.successSync({
            workerId: "retention",
            at: new Date(),
            meta: {
                mode: "run-once",
                accessEventsDeleted: result.accessEventsDeleted,
                auditLogsDeleted: result.auditLogsDeleted
            }
        });

        return {
            accessEventsDeleted: result.accessEventsDeleted,
            auditLogsDeleted: result.auditLogsDeleted,
            accessEventsCutoff: result.accessEventsCutoff,
            auditLogsCutoff: result.auditLogsCutoff,
            batch: retentionCfg.batch,
            accessEventsDays: retentionCfg.accessEventsDays,
            auditLogsDays: retentionCfg.auditLogsDays
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        heartbeats.errorSync({
            workerId: "retention",
            at: new Date(),
            error: message,
            meta: { mode: "run-once" }
        });
        throw error;
    }
}
