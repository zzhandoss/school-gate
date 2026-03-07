import os from "node:os";
import path from "node:path";
import { getCoreDbFile, getDeviceDbFile, getLoggingConfig, loadEnv } from "@school-gate/config";
import type { BackupCliOptions, BackupRuntimeConfig } from "./types.js";

function parseBooleanEnv(value: string | undefined, fallback: boolean) {
    if (value === undefined || value === "") return fallback;
    return value === "true";
}

function parseNumberEnv(value: string | undefined, fallback: number) {
    if (value === undefined || value === "") return fallback;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error(`Expected non-negative integer, received: ${value}`);
    }
    return parsed;
}

function defaultBackupDir(rootDir: string) {
    if (path.basename(rootDir) === "current") {
        return path.join(path.dirname(rootDir), "backups");
    }
    return path.join(rootDir, "data", "backups");
}

function assertWithinRoot(rootDir: string, targetPath: string, label: string) {
    const relative = path.relative(rootDir, targetPath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
        throw new Error(`${label} must stay within rootDir: ${targetPath}`);
    }
}

export function resolveRuntimeConfig(input: BackupCliOptions = {}): BackupRuntimeConfig {
    const rootDir = path.resolve(input.rootDir ?? process.cwd());
    const envPath = path.resolve(input.envPath ?? path.join(rootDir, ".env"));
    const envInfo = loadEnv({ paths: [envPath], override: true });
    const baseDir = envInfo.baseDir;
    const coreDbPath = path.resolve(baseDir, getCoreDbFile());
    const deviceDbPath = path.resolve(baseDir, getDeviceDbFile());
    const logsDir = path.resolve(baseDir, input.logsDir ?? getLoggingConfig().dir);
    const backupDir = path.resolve(input.backupDir ?? process.env.BACKUP_DIR ?? defaultBackupDir(rootDir));
    const safetyDir = path.resolve(input.safetyDir ?? path.join(backupDir, "safety"));
    const licenseDir = input.licenseDir ?? process.env.BACKUP_LICENSE_DIR;

    assertWithinRoot(rootDir, envPath, "envPath");
    assertWithinRoot(rootDir, coreDbPath, "coreDbPath");
    assertWithinRoot(rootDir, deviceDbPath, "deviceDbPath");
    assertWithinRoot(rootDir, logsDir, "logsDir");
    if (licenseDir) {
        assertWithinRoot(rootDir, path.resolve(baseDir, licenseDir), "licenseDir");
    }

    return {
        rootDir,
        envPath,
        backupDir,
        safetyDir,
        coreDbPath,
        deviceDbPath,
        logsDir,
        logsMaxFiles: input.logsMaxFiles ?? parseNumberEnv(process.env.BACKUP_LOGS_MAX_FILES, 4),
        includeLogs: input.includeLogs ?? parseBooleanEnv(process.env.BACKUP_INCLUDE_LOGS, false),
        licenseDir: licenseDir ? path.resolve(baseDir, licenseDir) : null,
        keepNightly: input.keepNightly ?? parseNumberEnv(process.env.BACKUP_KEEP_NIGHTLY, 14),
        keepPreUpdate: input.keepPreUpdate ?? parseNumberEnv(process.env.BACKUP_KEEP_PREUPDATE, 3)
    };
}

export function createBackupId(now = new Date()) {
    const iso = now.toISOString().replace(/[-:]/gu, "").replace(/\.\d{3}Z$/u, "Z");
    return iso;
}

export function getHostName() {
    return os.hostname();
}

export function toRootRelative(rootDir: string, targetPath: string) {
    const relative = path.relative(rootDir, targetPath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
        throw new Error(`Path cannot be represented relative to rootDir: ${targetPath}`);
    }
    return relative;
}

