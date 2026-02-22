import type { RuntimeSettingField, RuntimeSettingsSnapshot } from "@school-gate/core";
import { runtimeSettingsSnapshotSchema, type RuntimeSettingsSnapshotDto } from "@school-gate/contracts";
import type { RuntimeSettingsModule } from "../../delivery/http/routes/runtimeSettings.routes.js";
import type { ApiRuntime } from "../../runtime/createRuntime.js";

function toIso(value: Date | undefined): string | undefined {
    return value ? value.toISOString() : undefined;
}

function mapField<T extends number | string | boolean>(field: RuntimeSettingField<T>) {
    return {
        ...field,
        updatedAt: toIso(field.updatedAt)
    };
}

function mapSnapshot(snapshot: RuntimeSettingsSnapshot): RuntimeSettingsSnapshotDto {
    const dto: RuntimeSettingsSnapshotDto = {
        worker: {
            pollMs: mapField(snapshot.worker.pollMs),
            batch: mapField(snapshot.worker.batch),
            autoResolvePersonByIin: mapField(snapshot.worker.autoResolvePersonByIin)
        },
        outbox: {
            pollMs: mapField(snapshot.outbox.pollMs),
            batch: mapField(snapshot.outbox.batch),
            maxAttempts: mapField(snapshot.outbox.maxAttempts),
            leaseMs: mapField(snapshot.outbox.leaseMs),
            processingBy: mapField(snapshot.outbox.processingBy)
        },
        accessEvents: {
            pollMs: mapField(snapshot.accessEvents.pollMs),
            batch: mapField(snapshot.accessEvents.batch),
            retryDelayMs: mapField(snapshot.accessEvents.retryDelayMs),
            leaseMs: mapField(snapshot.accessEvents.leaseMs),
            maxAttempts: mapField(snapshot.accessEvents.maxAttempts),
            processingBy: mapField(snapshot.accessEvents.processingBy)
        },
        retention: {
            pollMs: mapField(snapshot.retention.pollMs),
            batch: mapField(snapshot.retention.batch),
            accessEventsDays: mapField(snapshot.retention.accessEventsDays),
            auditLogsDays: mapField(snapshot.retention.auditLogsDays)
        },
        monitoring: {
            workerTtlMs: mapField(snapshot.monitoring.workerTtlMs)
        },
        notifications: {
            parentTemplate: mapField(snapshot.notifications.parentTemplate),
            parentMaxAgeMs: mapField(snapshot.notifications.parentMaxAgeMs),
            alertMaxAgeMs: mapField(snapshot.notifications.alertMaxAgeMs)
        }
    };

    return runtimeSettingsSnapshotSchema.parse(dto);
}

export function createSettingsFeature(runtime: ApiRuntime): RuntimeSettingsModule {
    return {
        list: () => mapSnapshot(runtime.settingsService.listRuntimeSettingsSnapshot()),
        set: (input, adminId) => runtime.settingsService.setRuntimeSettings(input, { actorId: adminId })
    };
}
