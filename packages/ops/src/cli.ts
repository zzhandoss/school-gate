import { createBackup } from "./backup/create.js";
import { pruneBackups } from "./backup/prune.js";
import { restoreBackup } from "./backup/restore.js";
import { verifyBackup } from "./backup/verify.js";
import type { BackupCliOptions, BackupKind } from "./backup/types.js";

function takeValue(args: string[], index: number, flag: string) {
    const value = args[index + 1];
    if (value === undefined || value.startsWith("--")) {
        throw new Error(`${flag} requires a value`);
    }
    return value;
}

function parseOptions(args: string[]) {
    const options: BackupCliOptions & { kind?: BackupKind; backupPath?: string } = {};
    for (let index = 0; index < args.length; index += 1) {
        const token = args[index];
        switch (token) {
            case "--kind":
                options.kind = takeValue(args, index, token) as BackupKind;
                index += 1;
                break;
            case "--root-dir":
                options.rootDir = takeValue(args, index, token);
                index += 1;
                break;
            case "--env-path":
                options.envPath = takeValue(args, index, token);
                index += 1;
                break;
            case "--backup-dir":
                options.backupDir = takeValue(args, index, token);
                index += 1;
                break;
            case "--safety-dir":
                options.safetyDir = takeValue(args, index, token);
                index += 1;
                break;
            case "--license-dir":
                options.licenseDir = takeValue(args, index, token);
                index += 1;
                break;
            case "--logs-dir":
                options.logsDir = takeValue(args, index, token);
                index += 1;
                break;
            case "--logs-max-files":
                options.logsMaxFiles = Number(takeValue(args, index, token));
                index += 1;
                break;
            case "--keep-nightly":
                options.keepNightly = Number(takeValue(args, index, token));
                index += 1;
                break;
            case "--keep-preupdate":
                options.keepPreUpdate = Number(takeValue(args, index, token));
                index += 1;
                break;
            case "--backup-path":
                options.backupPath = takeValue(args, index, token);
                index += 1;
                break;
            case "--include-logs":
                options.includeLogs = true;
                break;
            default:
                throw new Error(`Unknown argument: ${token}`);
        }
    }
    return options;
}

function printResult(result: unknown) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

async function main() {
    const [command, ...rest] = process.argv.slice(2);
    const options = parseOptions(rest);

    switch (command) {
        case "create":
            if (!options.kind) {
                throw new Error("create requires --kind nightly|pre-update");
            }
            printResult(createBackup({ ...options, kind: options.kind }));
            return;
        case "verify":
            if (!options.backupPath) {
                throw new Error("verify requires --backup-path");
            }
            printResult(verifyBackup(options.backupPath));
            return;
        case "prune":
            printResult(pruneBackups(options));
            return;
        case "restore":
            if (!options.backupPath) {
                throw new Error("restore requires --backup-path");
            }
            printResult(restoreBackup({ ...options, backupPath: options.backupPath }));
            return;
        default:
            throw new Error("Expected command: create | verify | prune | restore");
    }
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
});
