import fs from "node:fs";
import path from "node:path";

type LoadEnvOptions = {
    paths?: string[];
    override?: boolean;
};

export type LoadEnvResult = {
    envPath: string | null;
    baseDir: string;
    loadedPaths: string[];
};

function findUpFile(fileName: string, startDir: string): string | null {
    let currentDir = path.resolve(startDir);
    // Walk up to filesystem root
    while (true) {
        const candidate = path.join(currentDir, fileName);
        if (fs.existsSync(candidate)) {
            return candidate;
        }

        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) {
            return null;
        }
        currentDir = parentDir;
    }
}

function stripQuotes(value: string): string {
    const trimmed = value.trim();
    if (
        (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}

function parseLine(line: string): [string, string] | null {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
        return null;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex <= 0) {
        return null;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1);
    if (!key) {
        return null;
    }

    return [key, stripQuotes(rawValue)];
}

export function loadEnv(options: LoadEnvOptions = {}): LoadEnvResult {
    const defaultEnvPath = findUpFile(".env", process.cwd()) ?? ".env";
    const paths = options.paths ?? [defaultEnvPath];
    const override = options.override ?? false;
    let lastLoadedEnvPath: string | null = null;
    const loadedPaths: string[] = [];

    for (const envPath of paths) {
        const resolvedPath = path.resolve(envPath);
        if (!fs.existsSync(resolvedPath)) {
            continue;
        }
        lastLoadedEnvPath = resolvedPath;
        loadedPaths.push(resolvedPath);

        const content = fs.readFileSync(resolvedPath, "utf8");
        const lines = content.split(/\r?\n/u);

        for (const line of lines) {
            const parsed = parseLine(line);
            if (!parsed) continue;
            const [key, value] = parsed;
            if (!override && process.env[key] !== undefined) {
                continue;
            }
            process.env[key] = value;
        }
    }

    const baseDir = lastLoadedEnvPath ? path.dirname(lastLoadedEnvPath) : process.cwd();
    return {
        envPath: lastLoadedEnvPath,
        baseDir,
        loadedPaths,
    };
}
