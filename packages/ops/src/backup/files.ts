import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const SQLITE_SIDE_FILES = ["", "-wal", "-shm"];

export function ensureDir(dirPath: string) {
    fs.mkdirSync(dirPath, { recursive: true });
}

export function ensureFileExists(filePath: string, label: string) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`${label} not found: ${filePath}`);
    }
}

export function copyFileToDir(sourcePath: string, targetDir: string) {
    ensureDir(targetDir);
    const targetPath = path.join(targetDir, path.basename(sourcePath));
    fs.copyFileSync(sourcePath, targetPath);
    return targetPath;
}

export function copyDirectory(sourceDir: string, targetDir: string): string[] {
    ensureDir(targetDir);
    const copied: string[] = [];
    const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
    for (const entry of entries) {
        const sourcePath = path.join(sourceDir, entry.name);
        const targetPath = path.join(targetDir, entry.name);
        if (entry.isDirectory()) {
            copied.push(...copyDirectory(sourcePath, targetPath));
            continue;
        }
        ensureDir(path.dirname(targetPath));
        fs.copyFileSync(sourcePath, targetPath);
        copied.push(targetPath);
    }
    return copied;
}

export function copySqliteBundle(dbFilePath: string, targetDir: string): string[] {
    ensureDir(targetDir);
    const copied: string[] = [];
    for (const suffix of SQLITE_SIDE_FILES) {
        const sourcePath = `${dbFilePath}${suffix}`;
        if (!fs.existsSync(sourcePath)) continue;
        copied.push(copyFileToDir(sourcePath, targetDir));
    }
    if (copied.length === 0) {
        throw new Error(`SQLite bundle not found: ${dbFilePath}`);
    }
    return copied;
}

export function cleanupSqliteBundle(dbFilePath: string) {
    for (const suffix of SQLITE_SIDE_FILES) {
        const filePath = `${dbFilePath}${suffix}`;
        if (fs.existsSync(filePath)) {
            fs.rmSync(filePath, { force: true });
        }
    }
}

export function listFilesRecursive(dirPath: string): string[] {
    const files: string[] = [];
    if (!fs.existsSync(dirPath)) return files;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            files.push(...listFilesRecursive(entryPath));
            continue;
        }
        files.push(entryPath);
    }
    return files.sort();
}

export function writeJsonFile(filePath: string, value: unknown) {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function readJsonFile<T>(filePath: string): T {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as T;
}

export function createChecksumLines(rootDir: string, excludeFileName: string): string[] {
    const files = listFilesRecursive(rootDir)
        .filter((filePath) => path.basename(filePath) !== excludeFileName);

    return files.map((filePath) => {
        const hash = crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
        const relativePath = toPosix(path.relative(rootDir, filePath));
        return `${hash}  ${relativePath}`;
    });
}

export function writeChecksums(rootDir: string, filePath: string) {
    const lines = createChecksumLines(rootDir, path.basename(filePath));
    fs.writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

export function parseChecksums(filePath: string): Map<string, string> {
    const raw = fs.readFileSync(filePath, "utf8").trim();
    const entries = raw ? raw.split(/\r?\n/u) : [];
    const parsed = new Map<string, string>();
    for (const entry of entries) {
        const match = entry.match(/^([a-f0-9]{64})\s{2}(.+)$/u);
        if (!match) {
            throw new Error(`Invalid checksum line in ${filePath}: ${entry}`);
        }
        const [, hash, relativePath] = match;
        if (!hash || !relativePath) {
            throw new Error(`Invalid checksum capture groups in ${filePath}: ${entry}`);
        }
        parsed.set(relativePath, hash);
    }
    return parsed;
}

export function toPosix(value: string) {
    return value.split(path.sep).join("/");
}
