import { and, asc, eq, inArray, like, or } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { terminalDirectoryEntries } from "@school-gate/db/schema";
import type {
    ListTerminalDirectoryEntriesInput,
    TerminalDirectoryEntriesRepo,
    TerminalDirectoryEntry,
    UpsertTerminalDirectoryEntryInput
} from "@school-gate/core";

function toDate(value: unknown): Date {
    return value instanceof Date ? value : new Date(String(value));
}

function parseSourceSummary(value: string | null): string[] {
    if (!value) {
        return [];
    }
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
        return [];
    }
}

function mapEntry(row: typeof terminalDirectoryEntries.$inferSelect): TerminalDirectoryEntry {
    return {
        id: row.id,
        deviceId: row.deviceId,
        terminalPersonId: row.terminalPersonId,
        iin: row.iin ?? null,
        displayName: row.displayName ?? null,
        userType: row.userType ?? null,
        userStatus: row.userStatus ?? null,
        authority: row.authority ?? null,
        validFrom: row.validFrom ?? null,
        validTo: row.validTo ?? null,
        cardNo: row.cardNo ?? null,
        cardName: row.cardName ?? null,
        sourceSummary: parseSourceSummary(row.sourceSummaryJson ?? null),
        rawUserPayload: row.rawUserPayload ?? null,
        rawCardPayload: row.rawCardPayload ?? null,
        payloadHash: row.payloadHash,
        isPresentInLastSync: row.isPresentInLastSync,
        lastSeenAt: toDate(row.lastSeenAt),
        lastSyncRunId: row.lastSyncRunId ?? null,
        createdAt: toDate(row.createdAt),
        updatedAt: toDate(row.updatedAt)
    };
}

function buildWhereClause(input?: ListTerminalDirectoryEntriesInput) {
    if (!input) {
        return undefined;
    }

    const filters = [];
    if (input.deviceId) {
        filters.push(eq(terminalDirectoryEntries.deviceId, input.deviceId));
    }
    if (input.iin) {
        filters.push(like(terminalDirectoryEntries.iin, `${input.iin}%`));
    }
    if (input.query) {
        const query = input.query.trim();
        filters.push(
            or(
                like(terminalDirectoryEntries.displayName, `%${query}%`),
                like(terminalDirectoryEntries.terminalPersonId, `%${query}%`),
                like(terminalDirectoryEntries.cardNo, `%${query}%`),
                like(terminalDirectoryEntries.iin, `%${query}%`)
            )
        );
    }
    if (input.includeStale === false) {
        filters.push(eq(terminalDirectoryEntries.isPresentInLastSync, true));
    }

    if (filters.length === 0) {
        return undefined;
    }
    if (filters.length === 1) {
        return filters[0];
    }
    return and(...filters);
}

export function createTerminalDirectoryEntriesRepo(db: Db): TerminalDirectoryEntriesRepo {
    return {
        async upsert(input: UpsertTerminalDirectoryEntryInput) {
            await db
                .insert(terminalDirectoryEntries)
                .values({
                    id: input.id,
                    deviceId: input.deviceId,
                    terminalPersonId: input.terminalPersonId,
                    iin: input.iin,
                    displayName: input.displayName,
                    userType: input.userType,
                    userStatus: input.userStatus,
                    authority: input.authority,
                    validFrom: input.validFrom,
                    validTo: input.validTo,
                    cardNo: input.cardNo,
                    cardName: input.cardName,
                    sourceSummaryJson: JSON.stringify(input.sourceSummary),
                    rawUserPayload: input.rawUserPayload,
                    rawCardPayload: input.rawCardPayload,
                    payloadHash: input.payloadHash,
                    isPresentInLastSync: true,
                    lastSeenAt: input.lastSeenAt,
                    lastSyncRunId: input.lastSyncRunId,
                    updatedAt: input.lastSeenAt
                })
                .onConflictDoUpdate({
                    target: [terminalDirectoryEntries.deviceId, terminalDirectoryEntries.terminalPersonId],
                    set: {
                        iin: input.iin,
                        displayName: input.displayName,
                        userType: input.userType,
                        userStatus: input.userStatus,
                        authority: input.authority,
                        validFrom: input.validFrom,
                        validTo: input.validTo,
                        cardNo: input.cardNo,
                        cardName: input.cardName,
                        sourceSummaryJson: JSON.stringify(input.sourceSummary),
                        rawUserPayload: input.rawUserPayload,
                        rawCardPayload: input.rawCardPayload,
                        payloadHash: input.payloadHash,
                        isPresentInLastSync: true,
                        lastSeenAt: input.lastSeenAt,
                        lastSyncRunId: input.lastSyncRunId,
                        updatedAt: input.lastSeenAt
                    }
                });
        },

        async markAllNotPresentForDevice({ deviceId }) {
            await db
                .update(terminalDirectoryEntries)
                .set({ isPresentInLastSync: false })
                .where(eq(terminalDirectoryEntries.deviceId, deviceId));
        },

        async list(input) {
            const whereClause = buildWhereClause(input);
            const rows = await db
                .select()
                .from(terminalDirectoryEntries)
                .where(whereClause)
                .orderBy(asc(terminalDirectoryEntries.deviceId), asc(terminalDirectoryEntries.terminalPersonId));
            return rows.map(mapEntry);
        },

        async getByIds({ ids }) {
            if (ids.length === 0) {
                return [];
            }
            const rows = await db
                .select()
                .from(terminalDirectoryEntries)
                .where(inArray(terminalDirectoryEntries.id, ids));
            return rows.map(mapEntry);
        },

        withTx(tx) {
            return createTerminalDirectoryEntriesRepo(tx as Db);
        }
    };
}
