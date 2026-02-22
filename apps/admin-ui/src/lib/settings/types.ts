export type RuntimeField<T> = {
    key: string
    env: T
    effective: T
    db?: T
    updatedAt?: string
};

export type RuntimeSettingsSnapshot = {
    worker: {
        pollMs: RuntimeField<number>
        batch: RuntimeField<number>
        autoResolvePersonByIin: RuntimeField<boolean>
    }
    outbox: {
        pollMs: RuntimeField<number>
        batch: RuntimeField<number>
        maxAttempts: RuntimeField<number>
        leaseMs: RuntimeField<number>
        processingBy: RuntimeField<string>
    }
    accessEvents: {
        pollMs: RuntimeField<number>
        batch: RuntimeField<number>
        retryDelayMs: RuntimeField<number>
        leaseMs: RuntimeField<number>
        maxAttempts: RuntimeField<number>
        processingBy: RuntimeField<string>
    }
    retention: {
        pollMs: RuntimeField<number>
        batch: RuntimeField<number>
        accessEventsDays: RuntimeField<number>
        auditLogsDays: RuntimeField<number>
    }
    monitoring: {
        workerTtlMs: RuntimeField<number>
    }
    notifications: {
        parentTemplate: RuntimeField<string>
        parentMaxAgeMs: RuntimeField<number>
        alertMaxAgeMs: RuntimeField<number>
    }
};

export type SetRuntimeSettingsInput = {
    worker?: {
        pollMs?: number
        batch?: number
        autoResolvePersonByIin?: boolean
    }
    outbox?: {
        pollMs?: number
        batch?: number
        maxAttempts?: number
        leaseMs?: number
        processingBy?: string
    }
    accessEvents?: {
        pollMs?: number
        batch?: number
        retryDelayMs?: number
        leaseMs?: number
        maxAttempts?: number
        processingBy?: string
    }
    retention?: {
        pollMs?: number
        batch?: number
        accessEventsDays?: number
        auditLogsDays?: number
    }
    monitoring?: {
        workerTtlMs?: number
    }
    notifications?: {
        parentTemplate?: string
        parentMaxAgeMs?: number
        alertMaxAgeMs?: number
    }
};
