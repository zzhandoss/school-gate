import fs from "node:fs";
import path from "node:path";
import { copyDirectory, copyFileToDir, copySqliteBundle, ensureDir, writeChecksums, writeJsonFile } from "./files.js";
import { createBackupId, getHostName, resolveRuntimeConfig, toRootRelative } from "./runtime.js";
import type { BackupComponentManifest, BackupManifest, CreateBackupInput } from "./types.js";

function listRecentLogFiles(logsDir: string, maxFiles: number) {
    if (!fs.existsSync(logsDir) || maxFiles <= 0) return [];
    return fs.readdirSync(logsDir, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => path.join(logsDir, entry.name))
        .sort((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs)
        .slice(0, maxFiles);
}

function buildComponent(
    name: BackupComponentManifest["name"],
    required: boolean,
    targetPath: string,
    bundleRoot: string,
    copiedFiles: string[],
    notes?: string
): BackupComponentManifest {
    return {
        name,
        required,
        targetPath,
        files: copiedFiles.map((filePath) => path.relative(bundleRoot, filePath)).sort(),
        ...(notes ? { notes } : {})
    };
}

export function createBackup(input: CreateBackupInput) {
    const runtime = resolveRuntimeConfig(input);
    const backupId = createBackupId();
    const backupPath = path.join(runtime.backupDir, input.kind, backupId);

    if (fs.existsSync(backupPath)) {
        throw new Error(`Backup path already exists: ${backupPath}`);
    }

    ensureDir(backupPath);

    const components: BackupComponentManifest[] = [];

    const configDir = path.join(backupPath, "config");
    const copiedEnv = copyFileToDir(runtime.envPath, configDir);
    components.push(buildComponent("config", true, toRootRelative(runtime.rootDir, runtime.envPath), backupPath, [copiedEnv]));

    const coreDir = path.join(backupPath, "core");
    const copiedCore = copySqliteBundle(runtime.coreDbPath, coreDir);
    components.push(buildComponent("coreDb", true, toRootRelative(runtime.rootDir, runtime.coreDbPath), backupPath, copiedCore));

    const deviceDir = path.join(backupPath, "device-service");
    const copiedDevice = copySqliteBundle(runtime.deviceDbPath, deviceDir);
    components.push(buildComponent("deviceDb", true, toRootRelative(runtime.rootDir, runtime.deviceDbPath), backupPath, copiedDevice));

    if (runtime.licenseDir && fs.existsSync(runtime.licenseDir)) {
        const licenseTargetDir = path.join(backupPath, "license");
        const copiedLicense = copyDirectory(runtime.licenseDir, licenseTargetDir);
        components.push(
            buildComponent("license", false, toRootRelative(runtime.rootDir, runtime.licenseDir), backupPath, copiedLicense)
        );
    }

    if (runtime.includeLogs) {
        const recentLogs = listRecentLogFiles(runtime.logsDir, runtime.logsMaxFiles);
        if (recentLogs.length > 0) {
            const logTargetDir = path.join(backupPath, "logs");
            const copiedLogs = recentLogs.map((filePath) => copyFileToDir(filePath, logTargetDir));
            components.push(
                buildComponent(
                    "logs",
                    false,
                    toRootRelative(runtime.rootDir, runtime.logsDir),
                    backupPath,
                    copiedLogs,
                    `recent:${runtime.logsMaxFiles}`
                )
            );
        }
    }

    const manifest: BackupManifest = {
        schemaVersion: 1,
        backupId,
        kind: input.kind,
        createdAt: new Date().toISOString(),
        host: getHostName(),
        components
    };

    writeJsonFile(path.join(backupPath, "manifest.json"), manifest);
    writeChecksums(backupPath, path.join(backupPath, "checksums.txt"));

    return { backupId, backupPath, manifest };
}

