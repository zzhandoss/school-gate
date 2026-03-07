import fs from "node:fs";
import path from "node:path";
import { resolveRuntimeConfig } from "./runtime.js";
import type { BackupCliOptions } from "./types.js";

function pruneKind(kindDir: string, keep: number) {
    if (!fs.existsSync(kindDir) || keep < 0) return [] as string[];
    const entries = fs.readdirSync(kindDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
        .reverse();

    const removed: string[] = [];
    for (const entry of entries.slice(keep)) {
        const targetPath = path.join(kindDir, entry);
        fs.rmSync(targetPath, { recursive: true, force: true });
        removed.push(targetPath);
    }
    return removed;
}

export function pruneBackups(input: BackupCliOptions = {}) {
    const runtime = resolveRuntimeConfig(input);
    const nightlyRemoved = pruneKind(path.join(runtime.backupDir, "nightly"), runtime.keepNightly);
    const preUpdateRemoved = pruneKind(path.join(runtime.backupDir, "pre-update"), runtime.keepPreUpdate);
    return {
        nightlyRemoved,
        preUpdateRemoved
    };
}

