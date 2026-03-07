export type BackupKind = "nightly" | "pre-update";

export type BackupComponentName =
    | "config"
    | "coreDb"
    | "deviceDb"
    | "license"
    | "logs";

export type BackupComponentManifest = {
    name: BackupComponentName;
    required: boolean;
    targetPath: string;
    files: string[];
    notes?: string;
};

export type BackupManifest = {
    schemaVersion: 1;
    backupId: string;
    kind: BackupKind;
    createdAt: string;
    host: string;
    components: BackupComponentManifest[];
};

export type BackupRuntimeConfig = {
    rootDir: string;
    envPath: string;
    backupDir: string;
    safetyDir: string;
    coreDbPath: string;
    deviceDbPath: string;
    logsDir: string;
    logsMaxFiles: number;
    includeLogs: boolean;
    licenseDir: string | null;
    keepNightly: number;
    keepPreUpdate: number;
};

export type BackupCliOptions = {
    rootDir?: string;
    envPath?: string;
    backupDir?: string;
    safetyDir?: string;
    licenseDir?: string;
    logsDir?: string;
    includeLogs?: boolean;
    logsMaxFiles?: number;
    keepNightly?: number;
    keepPreUpdate?: number;
};

export type CreateBackupInput = BackupCliOptions & {
    kind: BackupKind;
};

export type VerifyBackupResult = {
    backupPath: string;
    verifiedFiles: number;
};

export type RestoreBackupInput = BackupCliOptions & {
    backupPath: string;
};

