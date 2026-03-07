import fs from "node:fs";
import path from "node:path";
import { copyDirectory, copyFileToDir, copySqliteBundle, ensureDir, readJsonFile, cleanupSqliteBundle, writeChecksums, writeJsonFile } from "./files.js";
import { createBackupId, getHostName, resolveRuntimeConfig } from "./runtime.js";
import { verifyBackup } from "./verify.js";
import type { BackupComponentManifest, BackupManifest, RestoreBackupInput } from "./types.js";

function componentByName(manifest: BackupManifest, name: BackupComponentManifest["name"]) {
    return manifest.components.find((component) => component.name === name) ?? null;
}

function restoreFile(sourcePath: string, targetPath: string) {
    ensureDir(path.dirname(targetPath));
    fs.copyFileSync(sourcePath, targetPath);
}

function createSafetyCopy(manifest: BackupManifest, runtime: ReturnType<typeof resolveRuntimeConfig>) {
    const safetyId = `${createBackupId()}-before-restore`;
    const safetyPath = path.join(runtime.safetyDir, safetyId);
    ensureDir(safetyPath);

    const components: BackupComponentManifest[] = [];
    if (fs.existsSync(runtime.envPath)) {
        const envCopy = copyFileToDir(runtime.envPath, path.join(safetyPath, "config"));
        components.push({
            name: "config",
            required: true,
            targetPath: ".env",
            files: [path.relative(safetyPath, envCopy)]
        });
    }

    if (fs.existsSync(runtime.coreDbPath)) {
        const coreCopies = copySqliteBundle(runtime.coreDbPath, path.join(safetyPath, "core"));
        components.push({
            name: "coreDb",
            required: false,
            targetPath: componentByName(manifest, "coreDb")?.targetPath ?? path.relative(runtime.rootDir, runtime.coreDbPath),
            files: coreCopies.map((filePath) => path.relative(safetyPath, filePath)).sort()
        });
    }

    if (fs.existsSync(runtime.deviceDbPath)) {
        const deviceCopies = copySqliteBundle(runtime.deviceDbPath, path.join(safetyPath, "device-service"));
        components.push({
            name: "deviceDb",
            required: false,
            targetPath: componentByName(manifest, "deviceDb")?.targetPath ?? path.relative(runtime.rootDir, runtime.deviceDbPath),
            files: deviceCopies.map((filePath) => path.relative(safetyPath, filePath)).sort()
        });
    }

    if (runtime.licenseDir && fs.existsSync(runtime.licenseDir)) {
        const copiedLicense = copyDirectory(runtime.licenseDir, path.join(safetyPath, "license"));
        components.push({
            name: "license",
            required: false,
            targetPath: path.relative(runtime.rootDir, runtime.licenseDir),
            files: copiedLicense.map((filePath) => path.relative(safetyPath, filePath)).sort()
        });
    }

    writeJsonFile(path.join(safetyPath, "manifest.json"), {
        schemaVersion: 1,
        backupId: safetyId,
        kind: manifest.kind,
        createdAt: new Date().toISOString(),
        host: getHostName(),
        components
    });
    writeChecksums(safetyPath, path.join(safetyPath, "checksums.txt"));
    return safetyPath;
}

function componentRelativeFilePath(component: BackupComponentManifest, relativeFile: string) {
    const normalized = relativeFile.split(/[\\/]/u);
    const componentRoot = component.files[0]?.split(/[\\/]/u)[0];
    if (!componentRoot || normalized[0] !== componentRoot) {
        return path.basename(relativeFile);
    }
    const rest = normalized.slice(1);
    return rest.length > 0 ? path.join(...rest) : path.basename(relativeFile);
}

function restoreSqliteComponent(backupPath: string, component: BackupComponentManifest, rootDir: string) {
    const targetDbPath = path.join(rootDir, component.targetPath);
    cleanupSqliteBundle(targetDbPath);
    for (const relativeFile of component.files) {
        const sourcePath = path.join(backupPath, relativeFile);
        restoreFile(sourcePath, path.join(path.dirname(targetDbPath), path.basename(sourcePath)));
    }
}

function restoreDirectoryComponent(backupPath: string, component: BackupComponentManifest, rootDir: string) {
    const targetDir = path.join(rootDir, component.targetPath);
    if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
    }
    ensureDir(targetDir);
    for (const relativeFile of component.files) {
        const sourcePath = path.join(backupPath, relativeFile);
        const relativeTargetPath = componentRelativeFilePath(component, relativeFile);
        restoreFile(sourcePath, path.join(targetDir, relativeTargetPath));
    }
}

export function restoreBackup(input: RestoreBackupInput) {
    const runtime = resolveRuntimeConfig(input);
    const backupPath = path.resolve(input.backupPath);
    verifyBackup(backupPath);

    const manifest = readJsonFile<BackupManifest>(path.join(backupPath, "manifest.json"));
    const safetyPath = createSafetyCopy(manifest, runtime);

    const config = componentByName(manifest, "config");
    const coreDb = componentByName(manifest, "coreDb");
    const deviceDb = componentByName(manifest, "deviceDb");
    if (!config || !coreDb || !deviceDb) {
        throw new Error("Backup manifest is missing required components");
    }

    const configFile = config.files[0];
    if (!configFile) {
        throw new Error("Backup config component has no files");
    }
    restoreFile(path.join(backupPath, configFile), path.join(runtime.rootDir, config.targetPath));
    restoreSqliteComponent(backupPath, coreDb, runtime.rootDir);
    restoreSqliteComponent(backupPath, deviceDb, runtime.rootDir);

    const license = componentByName(manifest, "license");
    if (license) {
        restoreDirectoryComponent(backupPath, license, runtime.rootDir);
    }

    return { backupPath, safetyPath };
}
