import { and, asc, inArray, lte } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { accessEvents } from "@school-gate/db/schema";
import type { AccessEventsRetentionRepo } from "@school-gate/core";

const terminalStatuses = ["PROCESSED", "UNMATCHED", "ERROR"] as const;

export function createAccessEventsRetentionRepo(db: Db): AccessEventsRetentionRepo {
    return {
        async deleteTerminalBefore({ cutoff, limit }) {
            const rows = await db
                .select({ id: accessEvents.id })
                .from(accessEvents)
                .where(and(inArray(accessEvents.status, terminalStatuses), lte(accessEvents.occurredAt, cutoff)))
                .orderBy(asc(accessEvents.occurredAt))
                .limit(limit);

            if (rows.length === 0) return 0;

            const ids = rows.map((row) => row.id);
            await db.delete(accessEvents).where(inArray(accessEvents.id, ids));
            return ids.length;
        },
        withTx(tx) {
            return createAccessEventsRetentionRepo(tx as Db);
        },

    };
}


