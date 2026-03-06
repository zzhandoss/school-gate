import { eq } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { terminalDirectorySyncRuns } from "@school-gate/db/schema";
import type {
    CompleteTerminalDirectorySyncRunInput,
    CreateTerminalDirectorySyncRunInput,
    TerminalDirectorySyncRun,
    TerminalDirectorySyncRunsRepo
} from "@school-gate/core";

function toDate(value: unknown): Date {
    return value instanceof Date ? value : new Date(String(value));
}

function mapRun(row: typeof terminalDirectorySyncRuns.$inferSelect): TerminalDirectorySyncRun {
    return {
        id: row.id,
        requestedByAdminId: row.requestedByAdminId ?? null,
        status: row.status as TerminalDirectorySyncRun["status"],
        includeCards: row.includeCards,
        pageSize: row.pageSize,
        targetJson: row.targetJson,
        deviceCount: row.deviceCount,
        processedDeviceCount: row.processedDeviceCount,
        entryCount: row.entryCount,
        errorCount: row.errorCount,
        summaryJson: row.summaryJson ?? null,
        startedAt: toDate(row.startedAt),
        finishedAt: row.finishedAt ? toDate(row.finishedAt) : null
    };
}

export function createTerminalDirectorySyncRunsRepo(db: Db): TerminalDirectorySyncRunsRepo {
    return {
        async create(input: CreateTerminalDirectorySyncRunInput) {
            await db.insert(terminalDirectorySyncRuns).values({
                id: input.id,
                requestedByAdminId: input.requestedByAdminId,
                status: input.status,
                includeCards: input.includeCards,
                pageSize: input.pageSize,
                targetJson: input.targetJson,
                deviceCount: input.deviceCount
            });
        },

        async complete(input: CompleteTerminalDirectorySyncRunInput) {
            await db.update(terminalDirectorySyncRuns).set({
                status: input.status,
                processedDeviceCount: input.processedDeviceCount,
                entryCount: input.entryCount,
                errorCount: input.errorCount,
                summaryJson: input.summaryJson,
                finishedAt: input.finishedAt
            }).where(eq(terminalDirectorySyncRuns.id, input.id));
        },

        async getById({ id }) {
            const rows = await db.select().from(terminalDirectorySyncRuns).where(eq(terminalDirectorySyncRuns.id, id)).limit(1);
            const row = rows[0];
            return row ? mapRun(row) : null;
        },

        withTx(tx) {
            return createTerminalDirectorySyncRunsRepo(tx as Db);
        }
    };
}
