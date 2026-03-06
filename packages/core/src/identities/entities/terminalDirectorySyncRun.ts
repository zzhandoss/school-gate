export type TerminalDirectorySyncRunStatus = "running" | "completed" | "failed" | "partial";

export type TerminalDirectorySyncRun = {
    id: string;
    requestedByAdminId: string | null;
    status: TerminalDirectorySyncRunStatus;
    includeCards: boolean;
    pageSize: number;
    targetJson: string;
    deviceCount: number;
    processedDeviceCount: number;
    entryCount: number;
    errorCount: number;
    summaryJson: string | null;
    startedAt: Date;
    finishedAt: Date | null;
};
