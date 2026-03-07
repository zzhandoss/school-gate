import fs from "node:fs";
import path from "node:path";
import { createChecksumLines, parseChecksums, readJsonFile } from "./files.js";
import type { BackupManifest, VerifyBackupResult } from "./types.js";

function assertRequiredComponents(manifest: BackupManifest) {
    const required = manifest.components.filter((component) => component.required);
    for (const component of required) {
        if (component.files.length === 0) {
            throw new Error(`Required component has no files: ${component.name}`);
        }
    }
}

export function verifyBackup(backupPath: string): VerifyBackupResult {
    if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup path not found: ${backupPath}`);
    }
    const manifestPath = path.join(backupPath, "manifest.json");
    const checksumsPath = path.join(backupPath, "checksums.txt");
    if (!fs.existsSync(manifestPath)) {
        throw new Error(`Backup manifest not found: ${manifestPath}`);
    }
    if (!fs.existsSync(checksumsPath)) {
        throw new Error(`Backup checksums not found: ${checksumsPath}`);
    }

    const manifest = readJsonFile<BackupManifest>(manifestPath);
    assertRequiredComponents(manifest);

    const expected = parseChecksums(checksumsPath);
    const actualLines = createChecksumLines(backupPath, "checksums.txt");
    const actual = new Map(
        actualLines.map((line) => {
            const [hash, relativePath] = line.split(/\s{2}/u);
            return [relativePath, hash] as const;
        })
    );

    if (expected.size !== actual.size) {
        throw new Error(`Checksum entry count mismatch: expected ${expected.size}, got ${actual.size}`);
    }

    for (const [relativePath, hash] of expected.entries()) {
        const actualHash = actual.get(relativePath);
        if (!actualHash) {
            throw new Error(`Missing file for checksum entry: ${relativePath}`);
        }
        if (actualHash !== hash) {
            throw new Error(`Checksum mismatch for ${relativePath}`);
        }
    }

    return { backupPath, verifiedFiles: actual.size };
}

