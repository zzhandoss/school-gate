import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const monitoringSnapshots = sqliteTable(
    "monitoring_snapshots",
    {
        id: text("id").primaryKey(),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .default(sql`(unixepoch())`),
        snapshotJson: text("snapshot_json").notNull(),
        outboxNewCount: integer("outbox_new_count").notNull(),
        outboxOldestNewAt: integer("outbox_oldest_new_at", { mode: "timestamp" }),
        accessOldestUnprocessedAt: integer("access_oldest_unprocessed_at", { mode: "timestamp" })
    },
    (t) => ({
        createdAtIdx: index("monitoring_snapshots_created_at_idx").on(t.createdAt)
    })
);
