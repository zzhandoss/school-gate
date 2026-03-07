import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createBackup } from "./create.js";
import { restoreBackup } from "./restore.js";

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

function createRoot() {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "sg-restore-"));
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
    fs.writeFileSync(path.join(dataDir, "app.db"), "core-v1");
    fs.writeFileSync(path.join(dataDir, "device.db"), "device-v1");
    fs.writeFileSync(path.join(licenseDir, "license.dat"), "license-v1");
    return rootDir;
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

describe("restore backup", () => {
    it("restores db and nested license files and creates safety copy", () => {
        const rootDir = createRoot();
        const backupDir = path.join(rootDir, "backups");
        const created = createBackup({
            kind: "pre-update",
            rootDir,
            backupDir,
            licenseDir: "./license"
        });

        fs.writeFileSync(path.join(rootDir, "data", "app.db"), "core-v2");
        fs.writeFileSync(path.join(rootDir, "data", "device.db"), "device-v2");
        fs.rmSync(path.join(rootDir, "license"), { recursive: true, force: true });

        const restored = restoreBackup({
            rootDir,
            backupDir,
            backupPath: created.backupPath,
            licenseDir: "./license"
        });

        expect(fs.readFileSync(path.join(rootDir, "data", "app.db"), "utf8")).toBe("core-v1");
        expect(fs.readFileSync(path.join(rootDir, "data", "device.db"), "utf8")).toBe("device-v1");
        expect(fs.readFileSync(path.join(rootDir, "license", "nested", "license.dat"), "utf8")).toBe("license-v1");
        expect(fs.existsSync(path.join(restored.safetyPath, "manifest.json"))).toBe(true);
    });
});
