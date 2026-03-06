import type { TerminalDirectoryEntry } from "../entities/terminalDirectoryEntry.js";

export type UpsertTerminalDirectoryEntryInput = {
    id: string;
    deviceId: string;
    terminalPersonId: string;
    iin: string | null;
    displayName: string | null;
    userType: string | null;
    userStatus: string | null;
    authority: string | null;
    validFrom: string | null;
    validTo: string | null;
    cardNo: string | null;
    cardName: string | null;
    sourceSummary: string[];
    rawUserPayload: string | null;
    rawCardPayload: string | null;
    payloadHash: string;
    lastSeenAt: Date;
    lastSyncRunId: string;
};

export type ListTerminalDirectoryEntriesInput = {
    deviceId?: string;
    iin?: string;
    query?: string;
    includeStale?: boolean;
};

export interface TerminalDirectoryEntriesRepo {
    upsert(input: UpsertTerminalDirectoryEntryInput): Promise<void>;
    markAllNotPresentForDevice(input: { deviceId: string }): Promise<void>;
    list(input?: ListTerminalDirectoryEntriesInput): Promise<TerminalDirectoryEntry[]>;
    getByIds(input: { ids: string[] }): Promise<TerminalDirectoryEntry[]>;
    withTx(tx: unknown): TerminalDirectoryEntriesRepo;
}
