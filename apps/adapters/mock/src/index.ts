import path from "node:path";
import crypto from "node:crypto";
import { loadEnv, getAdapterMockConfig } from "@school-gate/config";
import { createAdapterDb } from "./db.js";
import { createAdapterEventsRepo } from "./eventsRepo.js";
import { createPeopleCatalog, loadPeopleCatalogFromJson } from "./peopleCatalog.js";
import { createDeviceServiceClient } from "./deviceServiceClient.js";
import { createAdapterRuntime } from "./runtime.js";
import { createAdapterServer } from "./server.js";

const envInfo = loadEnv();
const config = getAdapterMockConfig();
const dbFile = path.isAbsolute(config.dbFile) ? config.dbFile : path.resolve(envInfo.baseDir, config.dbFile);

const dbClient = createAdapterDb(dbFile);
const eventsRepo = createAdapterEventsRepo(dbClient.db);
const peopleCatalog = createPeopleCatalog(loadPeopleCatalogFromJson());
const persistedInstanceKey = dbClient.getMeta("instance_key");
const instanceKey = config.instanceKey ?? persistedInstanceKey ?? crypto.randomUUID();
if (!persistedInstanceKey && !config.instanceKey) {
    dbClient.setMeta("instance_key", instanceKey);
}
const instanceName = config.instanceName ?? instanceKey;

const server = createAdapterServer({
    token: config.deviceServiceToken,
    eventsRepo,
    peopleCatalog
});

const deviceServiceClient = createDeviceServiceClient({
    baseUrl: config.deviceServiceBaseUrl,
    token: config.deviceServiceToken
});

const runtime = createAdapterRuntime({
    config: {
        vendorKey: config.vendorKey,
        instanceKey,
        instanceName,
        baseUrl: config.baseUrl,
        retentionMs: config.retentionMs,
        retentionSweepMs: config.retentionSweepMs,
        eventIntervalMs: config.eventIntervalMs,
        pushIntervalMs: config.pushIntervalMs,
        batchLimit: config.batchLimit,
        version: config.version!
    },
    eventsRepo,
    deviceServiceClient,
    peopleCatalog
});

server.listen(config.port, () => {
     
    console.log(`[adapter-mock] listening on ${config.port}`);
});

runtime.start();

const shutdown = () => {
    runtime.stop();
    server.close();
    dbClient.close();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
