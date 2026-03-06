import type { TerminalDirectorySyncRun, TerminalDirectorySyncRunStatus } from "../entities/terminalDirectorySyncRun.js";

export type CreateTerminalDirectorySyncRunInput = {
    id: string;
    requestedByAdminId: string | null;
    status: TerminalDirectorySyncRunStatus;
    includeCards: boolean;
    pageSize: number;
    targetJson: string;
    deviceCount: number;
};

export type CompleteTerminalDirectorySyncRunInput = {
    id: string;
    status: TerminalDirectorySyncRunStatus;
    processedDeviceCount: number;
    entryCount: number;
    errorCount: number;
    summaryJson: string | null;
    finishedAt: Date;
};

export interface TerminalDirectorySyncRunsRepo {
    create(input: CreateTerminalDirectorySyncRunInput): Promise<void>;
    complete(input: CompleteTerminalDirectorySyncRunInput): Promise<void>;
    getById(input: { id: string }): Promise<TerminalDirectorySyncRun | null>;
    withTx(tx: unknown): TerminalDirectorySyncRunsRepo;
}
