import type { OutboxRepo } from "../../ports/outbox.js";
import type { RuntimeConfigProvider } from "../../ports/index.js";
import type { RuntimeSettings } from "../../config/runtimeConfig.js";
import type { SettingsRepo } from "../repos/settings.repo.js";
import type { IdGenerator } from "../../utils/common.types.js";

export type RuntimeSettingField<T> = {
    key: string;
    env: T;
    effective: T;
    db?: T;
    updatedAt?: Date;
};

export type RuntimeSettingsSnapshot = {
    worker: {
        pollMs: RuntimeSettingField<number>;
        batch: RuntimeSettingField<number>;
        autoResolvePersonByIin: RuntimeSettingField<boolean>;
    };
    outbox: {
        pollMs: RuntimeSettingField<number>;
        batch: RuntimeSettingField<number>;
        maxAttempts: RuntimeSettingField<number>;
        leaseMs: RuntimeSettingField<number>;
        processingBy: RuntimeSettingField<string>;
    };
    accessEvents: {
        pollMs: RuntimeSettingField<number>;
        batch: RuntimeSettingField<number>;
        retryDelayMs: RuntimeSettingField<number>;
        leaseMs: RuntimeSettingField<number>;
        maxAttempts: RuntimeSettingField<number>;
        processingBy: RuntimeSettingField<string>;
    };
    retention: {
        pollMs: RuntimeSettingField<number>;
        batch: RuntimeSettingField<number>;
        accessEventsDays: RuntimeSettingField<number>;
        auditLogsDays: RuntimeSettingField<number>;
    };
    monitoring: {
        workerTtlMs: RuntimeSettingField<number>;
    };
    notifications: {
        parentTemplate: RuntimeSettingField<string>;
        parentMaxAgeMs: RuntimeSettingField<number>;
        alertMaxAgeMs: RuntimeSettingField<number>;
    };
};

export type SetRuntimeSettingsInput = {
    worker?: {
        pollMs?: number;
        batch?: number;
        autoResolvePersonByIin?: boolean;
    };
    outbox?: {
        pollMs?: number;
        batch?: number;
        maxAttempts?: number;
        leaseMs?: number;
        processingBy?: string;
    };
    accessEvents?: {
        pollMs?: number;
        batch?: number;
        retryDelayMs?: number;
        leaseMs?: number;
        maxAttempts?: number;
        processingBy?: string;
    };
    retention?: {
        pollMs?: number;
        batch?: number;
        accessEventsDays?: number;
        auditLogsDays?: number;
    };
    monitoring?: {
        workerTtlMs?: number;
    };
    notifications?: {
        parentTemplate?: string;
        parentMaxAgeMs?: number;
        alertMaxAgeMs?: number;
    };
};

export type SetRuntimeSettingsResult = {
    updated: number;
};

export type SetRuntimeSettingsClock = {
    now: () => Date;
};

export type SetRuntimeSettingsOptions = {
    actorId?: string | undefined;
};

export type SettingsService = {
    getRuntimeSettings(): RuntimeSettings;
    listRuntimeSettingsSnapshot(): RuntimeSettingsSnapshot;
    setRuntimeSettings(input: SetRuntimeSettingsInput, options?: SetRuntimeSettingsOptions): SetRuntimeSettingsResult;
    withTx(tx: unknown): SettingsService;
};

export type SettingsServiceDeps = {
    settingsRepo: SettingsRepo;
    outbox?: OutboxRepo | undefined;
    idGen?: IdGenerator | undefined;
    runtimeConfigProvider: RuntimeConfigProvider;
    clock: SetRuntimeSettingsClock;
};
