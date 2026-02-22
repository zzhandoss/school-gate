import type { AdapterRegistry, AdapterSession } from "./adapterRegistry.js";
import type { AdapterAssignment } from "@school-gate/device/core/usecases/listAdapterAssignments";
import type {
    RecordDeviceAccessEventInput,
    RecordDeviceAccessEventResult
} from "@school-gate/device/core/usecases/recordAccessEvent";
import type { AppLogger } from "@school-gate/infra";
import type { BackfillRunnerResult } from "./backfillRunner.js";
import type { AdminAuth } from "./adminAuth.js";
import type { DeviceServiceDevicesHandlers } from "./routes/devices.routes.js";
import type { DeviceServiceAdaptersHandlers } from "./routes/adapters.routes.js";
import type { DeviceServiceMonitoringHandlers } from "./routes/internalMonitoring.routes.js";
import { createDeviceAdapterHttpClient } from "@school-gate/device/infra/http/deviceAdapterHttpClient";
import { createIdentityFindResolver } from "@school-gate/device/infra/identity/identityFindResolver";
import { createHttpApp } from "./delivery/http/createHttpApp.js";
import { createAdapterIngressModule } from "./composition/features/adapters/adapterIngress.feature.js";
import { createAdaptersAdminModule } from "./composition/features/adapters/adaptersAdmin.feature.js";
import { createDevicesModule } from "./composition/features/devices/devices.feature.js";
import { createIdentityModule } from "./composition/features/identity/identity.feature.js";
import { ensureDeviceSettingsMatchSchema } from "./json-schema/deviceSettingsSchema.js";

export type DeviceServiceConfig = {
    corsAllowedOrigins?: string[];
    token: string;
    internalToken: string;
    heartbeatIntervalMs: number;
    batchLimit: number;
    deviceTtlMs: number;
};

export type DeviceServiceAppInput = {
    config: DeviceServiceConfig;
    logger: AppLogger;
    monitoring: DeviceServiceMonitoringHandlers;
    adminAuth: AdminAuth;
    registry: AdapterRegistry;
    listAssignments: (adapterKey: string) => { devices: AdapterAssignment[] };
    recordAccessEvent: (input: RecordDeviceAccessEventInput) => RecordDeviceAccessEventResult;
    runBackfill: (session: AdapterSession) => Promise<BackfillRunnerResult>;
    devices: DeviceServiceDevicesHandlers;
    adapters: DeviceServiceAdaptersHandlers;
};

export function createDeviceServiceApp(input: DeviceServiceAppInput) {
    const devices = createDevicesModule({
        ...input.devices,
        upsert: async (payload) => {
            const adapter = input.registry.list().find((session) => {
                return session.vendorKey === payload.adapterKey && session.mode === "active";
            });
            if (adapter?.deviceSettingsSchema) {
                ensureDeviceSettingsMatchSchema({
                    schema: adapter.deviceSettingsSchema,
                    settingsJson: payload.settingsJson ?? null
                });
            }

            await input.devices.upsert(payload);
        },
        update: async (id, payload) => {
            const existing = await input.devices.get(id);
            if (!existing) {
                return false;
            }

            if (payload.settingsJson !== undefined || payload.adapterKey !== undefined) {
                const effectiveAdapterKey = payload.adapterKey ?? existing.adapterKey;
                const effectiveSettingsJson =
                    payload.settingsJson === undefined ? existing.settingsJson : payload.settingsJson;
                const adapter = input.registry.list().find((session) => {
                    return session.vendorKey === effectiveAdapterKey && session.mode === "active";
                });
                if (adapter?.deviceSettingsSchema) {
                    ensureDeviceSettingsMatchSchema({
                        schema: adapter.deviceSettingsSchema,
                        settingsJson: effectiveSettingsJson
                    });
                }
            }

            return input.devices.update(id, payload);
        }
    });

    const resolveIdentity = createIdentityFindResolver({
        listDevices: async () => {
            const result = await input.devices.list();
            return result.devices.map((device) => ({
                deviceId: device.id,
                adapterKey: device.adapterKey,
                enabled: device.enabled,
                settingsJson: device.settingsJson
            }));
        },
        listAdapters: () =>
            input.registry.list().map((session) => ({
                adapterKey: session.vendorKey,
                baseUrl: session.baseUrl,
                mode: session.mode
            })),
        createAdapterClient: (baseUrl) =>
            createDeviceAdapterHttpClient({
                baseUrl,
                token: input.config.token
            })
    });
    const identity = createIdentityModule({
        find: (payload) =>
            resolveIdentity({
                identityKey: payload.identityKey,
                identityValue: payload.identityValue,
                ...(payload.limit !== undefined ? { limit: payload.limit } : {})
            })
    });

    return createHttpApp({
        logger: input.logger,
        ...(input.config.corsAllowedOrigins
            ? { corsAllowedOrigins: input.config.corsAllowedOrigins }
            : {}),
        adapterToken: input.config.token,
        internalToken: input.config.internalToken,
        adminAuth: input.adminAuth,
        adaptersIngress: createAdapterIngressModule({
            config: {
                heartbeatIntervalMs: input.config.heartbeatIntervalMs,
                batchLimit: input.config.batchLimit
            },
            logger: input.logger,
            registry: input.registry,
            listAssignments: input.listAssignments,
            recordAccessEvent: input.recordAccessEvent,
            runBackfill: input.runBackfill
        }),
        devices,
        adapters: {
            list: () => createAdaptersAdminModule({ registry: input.registry }).list()
        },
        monitoring: input.monitoring,
        identity
    });
}
