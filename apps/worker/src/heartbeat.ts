import os from "node:os";
import type { WorkerHeartbeatsRepo, WorkerHeartbeatMeta } from "@school-gate/core";

export type HeartbeatClock = {
    now: () => Date;
};

export function createHeartbeatWriter(input: {
    repo: WorkerHeartbeatsRepo;
    workerId: string;
    clock: HeartbeatClock;
    minIntervalMs?: number;
    baseMeta?: WorkerHeartbeatMeta;
}) {
    const minIntervalMs = input.minIntervalMs ?? 30_000;
    const hostMeta: WorkerHeartbeatMeta = {
        hostname: os.hostname(),
        pid: process.pid,
    };
    const baseMeta: WorkerHeartbeatMeta = {
        ...hostMeta,
        ...(input.baseMeta ?? {}),
    };

    let lastWriteAt: Date | null = null;

    function shouldWrite(at: Date): boolean {
        if (!lastWriteAt) return true;
        return at.getTime() - lastWriteAt.getTime() >= minIntervalMs;
    }

    function mergeMeta(meta?: WorkerHeartbeatMeta): WorkerHeartbeatMeta {
        return meta ? { ...baseMeta, ...meta } : baseMeta;
    }

    function recordWrite(at: Date) {
        lastWriteAt = at;
    }

    return {
        onStart(meta?: WorkerHeartbeatMeta) {
            const at = input.clock.now();
            input.repo.startSync({ workerId: input.workerId, at, meta: mergeMeta(meta) });
            recordWrite(at);
        },

        onSuccess(meta?: WorkerHeartbeatMeta) {
            const at = input.clock.now();
            if (!shouldWrite(at)) return;
            input.repo.successSync({ workerId: input.workerId, at, meta: mergeMeta(meta) });
            recordWrite(at);
        },

        onError(error: unknown, meta?: WorkerHeartbeatMeta) {
            const at = input.clock.now();
            const message = error instanceof Error ? error.message : String(error);
            input.repo.errorSync({
                workerId: input.workerId,
                at,
                error: message,
                meta: mergeMeta(meta),
            });
            recordWrite(at);
        },
    };
}

