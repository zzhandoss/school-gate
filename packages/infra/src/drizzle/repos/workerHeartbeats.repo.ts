import type { Db } from "@school-gate/db/drizzle";
import { workerHeartbeats } from "@school-gate/db/schema";
import type { WorkerHeartbeatsRepo, WorkerHeartbeatMeta } from "@school-gate/core";

function metaToJson(meta: WorkerHeartbeatMeta | undefined): string | null {
    if (meta === undefined) return null;
    try {
        return JSON.stringify(meta);
    } catch {
        return JSON.stringify({ note: "meta_json_failed_to_stringify" });
    }
}

export function createWorkerHeartbeatsRepo(db: Db): WorkerHeartbeatsRepo {
    return {
        startSync({ workerId, at, meta }) {
            const metaJson = metaToJson(meta);
            db
                .insert(workerHeartbeats)
                .values({
                    workerId,
                    updatedAt: at,
                    lastStartedAt: at,
                    metaJson
                })
                .onConflictDoUpdate({
                    target: workerHeartbeats.workerId,
                    set: {
                        updatedAt: at,
                        lastStartedAt: at,
                        metaJson
                    }
                })
                .run();
        },

        successSync({ workerId, at, meta }) {
            const metaJson = metaToJson(meta);
            db
                .insert(workerHeartbeats)
                .values({
                    workerId,
                    updatedAt: at,
                    lastSuccessAt: at,
                    lastErrorAt: null,
                    lastError: null,
                    metaJson
                })
                .onConflictDoUpdate({
                    target: workerHeartbeats.workerId,
                    set: {
                        updatedAt: at,
                        lastSuccessAt: at,
                        lastErrorAt: null,
                        lastError: null,
                        metaJson
                    }
                })
                .run();
        },

        errorSync({ workerId, at, error, meta }) {
            const metaJson = metaToJson(meta);
            db
                .insert(workerHeartbeats)
                .values({
                    workerId,
                    updatedAt: at,
                    lastErrorAt: at,
                    lastError: error,
                    metaJson
                })
                .onConflictDoUpdate({
                    target: workerHeartbeats.workerId,
                    set: {
                        updatedAt: at,
                        lastErrorAt: at,
                        lastError: error,
                        metaJson
                    }
                })
                .run();
        }
    };
}


