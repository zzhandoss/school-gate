import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createBackup } from "./create.js";
import { pruneBackups } from "./prune.js";
import { verifyBackup } from "./verify.js";
import type { BackupKind } from "./types.js";

const ENV_KEYS = [
    "DB_FILE",
    "DEVICE_DB_FILE",
    "LOG_DIR",
    "BACKUP_DIR",
    "BACKUP_INCLUDE_LOGS",
    "BACKUP_LOGS_MAX_FILES",
    "BACKUP_KEEP_NIGHTLY",
    "BACKUP_KEEP_PREUPDATE",
    "BACKUP_LICENSE_DIR"
] as const;

const previousEnv = new Map<string, string | undefined>();
for (const key of ENV_KEYS) {
    previousEnv.set(key, process.env[key]);
}

function createFixtureRoot() {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "sg-backup-"));
    const dataDir = path.join(rootDir, "data");
    const logsDir = path.join(dataDir, "logs");
    const licenseDir = path.join(rootDir, "license", "nested");
    fs.mkdirSync(logsDir, { recursive: true });
    fs.mkdirSync(licenseDir, { recursive: true });
    fs.writeFileSync(path.join(rootDir, ".env"), [
        "DB_FILE=./data/app.db",
        "DEVICE_DB_FILE=./data/device.db",
        "LOG_DIR=./data/logs"
    ].join("\n"));
    fs.writeFileSync(path.join(dataDir, "app.db"), "core");
    fs.writeFileSync(path.join(dataDir, "app.db-wal"), "core-wal");
    fs.writeFileSync(path.join(dataDir, "device.db"), "device");
    fs.writeFileSync(path.join(logsDir, "api.log"), "api log");
    fs.writeFileSync(path.join(logsDir, "worker.log"), "worker log");
    fs.writeFileSync(path.join(licenseDir, "license.dat"), "license");
    return rootDir;
}

function createOldBackup(rootDir: string, kind: BackupKind, id: string) {
    const targetDir = path.join(rootDir, "backups", kind, id);
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, "placeholder.txt"), "old");
}

afterEach(() => {
    for (const [key, value] of previousEnv.entries()) {
        if (value === undefined) {
            delete process.env[key];
            continue;
        }
        process.env[key] = value;
    }
});

describe("backup create/verify/prune", () => {
    it("creates a backup bundle with optional logs and license", () => {
        const rootDir = createFixtureRoot();
        const backupDir = path.join(rootDir, "backups");
        const result = createBackup({
            kind: "nightly",
            rootDir,
            backupDir,
            includeLogs: true,
            logsMaxFiles: 1,
            licenseDir: "./license"
        });

        expect(result.manifest.kind).toBe("nightly");
        expect(fs.existsSync(path.join(result.backupPath, "manifest.json"))).toBe(true);
        expect(fs.existsSync(path.join(result.backupPath, "checksums.txt"))).toBe(true);
        expect(result.manifest.components.map((component) => component.name)).toEqual([
            "config",
            "coreDb",
            "deviceDb",
            "license",
            "logs"
        ]);

        const verifyResult = verifyBackup(result.backupPath);
        expect(verifyResult.verifiedFiles).toBeGreaterThan(0);
    });

    it("prunes old backups per kind retention", () => {
        const rootDir = createFixtureRoot();
        createOldBackup(rootDir, "nightly", "20260101T000000Z");
        createOldBackup(rootDir, "nightly", "20260102T000000Z");
        createOldBackup(rootDir, "pre-update", "20260101T000000Z");
        process.env.BACKUP_DIR = path.join(rootDir, "backups");
        process.env.BACKUP_KEEP_NIGHTLY = "1";
        process.env.BACKUP_KEEP_PREUPDATE = "0";

        const result = pruneBackups({ rootDir });

        expect(result.nightlyRemoved).toHaveLength(1);
        expect(result.preUpdateRemoved).toHaveLength(1);
        expect(fs.existsSync(path.join(rootDir, "backups", "nightly", "20260102T000000Z"))).toBe(true);
        expect(fs.existsSync(path.join(rootDir, "backups", "nightly", "20260101T000000Z"))).toBe(false);
    });
});
