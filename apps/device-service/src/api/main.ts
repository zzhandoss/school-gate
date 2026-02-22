import crypto from "node:crypto";
import path from "node:path";
import { serve } from "@hono/node-server";
import { loadEnv, getDeviceDbFile, getDeviceServiceConfig } from "@school-gate/config";
import { createDeviceDb } from "@school-gate/device/device-db/drizzle";
import { createDeviceCursorsRepo } from "@school-gate/device/infra/drizzle/repos/deviceCursors.repo";
import { createDeviceEventsRepo } from "@school-gate/device/infra/drizzle/repos/deviceEvents.repo";
import { createDeviceOutboxRepo } from "@school-gate/device/infra/drizzle/repos/deviceOutbox.repo";
import { createDevicesRepo } from "@school-gate/device/infra/drizzle/repos/devices.repo";
import { createDeviceAdapterHttpClient } from "@school-gate/device/infra/http/deviceAdapterHttpClient";
import { createIdentityFindResolver } from "@school-gate/device/infra/identity/identityFindResolver";
import { createDeviceUnitOfWork } from "@school-gate/device/infra/drizzle/unitOfWork";
import { createListAdapterAssignmentsUC } from "@school-gate/device/core/usecases/listAdapterAssignments";
import { createRecordDeviceAccessEventUC } from "@school-gate/device/core/usecases/recordAccessEvent";
import { createGetDeviceMonitoringSnapshotUC } from "@school-gate/device/core/usecases/getDeviceMonitoringSnapshot";
import { createBackfillDeviceEventsUC } from "@school-gate/device/core/usecases/backfillDeviceEvents";
import { createListDevicesUC } from "@school-gate/device/core/usecases/listDevices";
import { createGetDeviceUC } from "@school-gate/device/core/usecases/getDevice";
import { createSetDeviceEnabledUC } from "@school-gate/device/core/usecases/setDeviceEnabled";
import { createUpsertDeviceUC } from "@school-gate/device/core/usecases/upsertDevice";
import { createUpdateDeviceUC } from "@school-gate/device/core/usecases/updateDevice";
import { createDeleteDeviceUC } from "@school-gate/device/core/usecases/deleteDevice";
import { createDeviceServiceLogger } from "../logger.js";
import { AdapterRegistry } from "./adapterRegistry.js";
import { createAdapterBackfillRunner } from "./backfillRunner.js";
import { createHttpApp } from "./delivery/http/createHttpApp.js";
import { adminAuth } from "./delivery/http/middleware/adminAuth.js";
import { createAdapterIngressModule } from "./composition/features/adapters/adapterIngress.feature.js";
import { createAdaptersAdminModule } from "./composition/features/adapters/adaptersAdmin.feature.js";
import { createDevicesModule } from "./composition/features/devices/devices.feature.js";
import { createIdentityModule } from "./composition/features/identity/identity.feature.js";
import { createMonitoringModule } from "./composition/features/monitoring/monitoring.feature.js";
import { ensureDeviceSettingsMatchSchema } from "./json-schema/deviceSettingsSchema.js";

const envInfo = loadEnv();
const logger = createDeviceServiceLogger("device-service-api");
const config = getDeviceServiceConfig();

const dbFile = getDeviceDbFile();
const dbFilePath = path.resolve(envInfo.baseDir, dbFile);
const dbClient = createDeviceDb(dbFilePath);
const registry = new AdapterRegistry({
    aliveTtlMs: config.heartbeatIntervalMs * 2
});
const idGen = { nextId: () => crypto.randomUUID() };
const clock = { now: () => new Date() };

const devicesRepo = createDevicesRepo(dbClient.db);
const deviceEventsRepo = createDeviceEventsRepo(dbClient.db);
const deviceOutboxRepo = createDeviceOutboxRepo(dbClient.db);
const deviceCursorsRepo = createDeviceCursorsRepo(dbClient.db);

const listAssignments = createListAdapterAssignmentsUC({
    devicesRepo,
    deviceCursorsRepo
});

const tx = createDeviceUnitOfWork(dbClient.db, {
    deviceEventsRepo: createDeviceEventsRepo,
    deviceOutboxRepo: createDeviceOutboxRepo
});

const recordAccessEvent = createRecordDeviceAccessEventUC({ tx, idGen });
const getDeviceMonitoringSnapshot = createGetDeviceMonitoringSnapshotUC({
    devicesRepo,
    deviceEventsRepo,
    deviceOutboxRepo,
    clock,
    deviceTtlMs: config.deviceTtlMs
});

const runBackfill = createAdapterBackfillRunner({
    listAssignments,
    createBackfillForAdapter: (baseUrl) => {
        const adapterClient = createDeviceAdapterHttpClient({
            baseUrl,
            token: config.token
        });
        return createBackfillDeviceEventsUC({
            adapterClient,
            deviceCursorsRepo,
            recordAccessEvent
        });
    },
    now: () => new Date(),
    minIntervalMs: config.heartbeatIntervalMs,
    limit: config.batchLimit
});

const adaptersIngress = createAdapterIngressModule({
    config: {
        heartbeatIntervalMs: config.heartbeatIntervalMs,
        batchLimit: config.batchLimit
    },
    logger,
    registry,
    listAssignments,
    recordAccessEvent,
    runBackfill
});

const listDevices = createListDevicesUC({ devicesRepo });
const getDevice = createGetDeviceUC({ devicesRepo });
const upsertDevice = createUpsertDeviceUC({ devicesRepo, clock });
const updateDevice = createUpdateDeviceUC({ devicesRepo, clock });
const setDeviceEnabled = createSetDeviceEnabledUC({ devicesRepo, clock });
const deleteDevice = createDeleteDeviceUC({ devicesRepo });

const devices = createDevicesModule({
    list: listDevices,
    get: getDevice,
    upsert: (input) => {
        const adapter = registry.list().find((session) => {
            return session.vendorKey === input.adapterKey && session.mode === "active";
        });
        if (adapter?.deviceSettingsSchema) {
            ensureDeviceSettingsMatchSchema({
                schema: adapter.deviceSettingsSchema,
                settingsJson: input.settingsJson ?? null
            });
        }

        upsertDevice({
            id: input.deviceId,
            name: input.name,
            direction: input.direction,
            adapterKey: input.adapterKey,
            settingsJson: input.settingsJson ?? null,
            enabled: input.enabled
        });
    },
    update: (id, input) => {
        if (input.settingsJson !== undefined || input.adapterKey !== undefined) {
            const existing = getDevice(id);
            if (!existing) {
                return false;
            }
            const effectiveAdapterKey = input.adapterKey ?? existing.adapterKey;
            const effectiveSettingsJson =
                input.settingsJson === undefined ? existing.settingsJson : input.settingsJson;
            const adapter = registry.list().find((session) => {
                return session.vendorKey === effectiveAdapterKey && session.mode === "active";
            });
            if (adapter?.deviceSettingsSchema) {
                ensureDeviceSettingsMatchSchema({
                    schema: adapter.deviceSettingsSchema,
                    settingsJson: effectiveSettingsJson
                });
            }
        }

        return updateDevice({
            id,
            name: input.name,
            direction: input.direction,
            adapterKey: input.adapterKey,
            settingsJson: input.settingsJson,
            enabled: input.enabled
        }).updated;
    },
    setEnabled: (input) => setDeviceEnabled({ id: input.deviceId, enabled: input.enabled }).updated,
    delete: (id) => deleteDevice(id).deleted
});

const monitoring = createMonitoringModule({
    registry,
    getDeviceMonitoringSnapshot,
    adapterTtlMs: config.heartbeatIntervalMs * 2,
    now: () => clock.now()
});

const resolveIdentity = createIdentityFindResolver({
    listDevices: async () => {
        const result = listDevices();
        return result.devices.map((device) => ({
            deviceId: device.id,
            adapterKey: device.adapterKey,
            enabled: device.enabled,
            settingsJson: device.settingsJson
        }));
    },
    listAdapters: () =>
        registry.list().map((session) => ({
            adapterKey: session.vendorKey,
            baseUrl: session.baseUrl,
            mode: session.mode
        })),
    createAdapterClient: (baseUrl) =>
        createDeviceAdapterHttpClient({
            baseUrl,
            token: config.token
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

const app = createHttpApp({
    logger,
    corsAllowedOrigins: config.corsAllowedOrigins,
    adapterToken: config.token,
    internalToken: config.internalToken,
    adminAuth: adminAuth({ jwtSecret: config.adminJwtSecret }),
    adaptersIngress,
    devices,
    adapters: createAdaptersAdminModule({ registry }),
    monitoring,
    identity
});

const server = serve(
    {
        fetch: app.fetch,
        port: config.port
    },
    (info) => {
        logger.info({ port: info.port }, "device-service api started");
    }
);

const close = () => {
    dbClient.close();
    server.close();
};

process.on("SIGINT", close);
process.on("SIGTERM", close);
