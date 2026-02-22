import { asc, inArray, lte } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { auditLogs } from "@school-gate/db/schema";
import type { AuditLogsRetentionRepo } from "@school-gate/core";

export function createAuditLogsRetentionRepo(db: Db): AuditLogsRetentionRepo {
    return {
        async deleteBefore({ cutoff, limit }) {
            const rows = await db
                .select({ id: auditLogs.id })
                .from(auditLogs)
                .where(lte(auditLogs.at, cutoff))
                .orderBy(asc(auditLogs.at))
                .limit(limit);

            if (rows.length === 0) return 0;

            const ids = rows.map((row) => row.id);
            await db.delete(auditLogs).where(inArray(auditLogs.id, ids));
            return ids.length;
        },
        withTx(tx) {
            return createAuditLogsRetentionRepo(tx as Db);
        }

    };
}


