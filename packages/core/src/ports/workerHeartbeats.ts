export type WorkerHeartbeatMeta = Record<string, unknown>;

export type WorkerHeartbeat = {
    workerId: string;
    updatedAt: Date;
    lastStartedAt: Date | null;
    lastSuccessAt: Date | null;
    lastErrorAt: Date | null;
    lastError: string | null;
    meta: WorkerHeartbeatMeta | null;
};

export type WorkerHeartbeatsRepo = {
    startSync(input: { workerId: string; at: Date; meta?: WorkerHeartbeatMeta }): void;
    successSync(input: { workerId: string; at: Date; meta?: WorkerHeartbeatMeta }): void;
    errorSync(input: { workerId: string; at: Date; error: string; meta?: WorkerHeartbeatMeta }): void;
};

