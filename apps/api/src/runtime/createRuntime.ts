import crypto from "node:crypto";
import path from "node:path";
import {
    getAccessEventsWorkerConfig,
    getApiConfig,
    getBotClientConfig,
    getCoreDbFile,
    getLoggingConfig,
    getMonitoringConfig,
    getMonitoringOpsConfig,
    loadEnv
} from "@school-gate/config";
import { createDb } from "@school-gate/db";
import {
    createLogger,
    createDeviceServiceMonitoringHttpClient,
    createFileLogger,
    createMonitoringComponentsProvider,
    createOutbox,
    createRuntimeConfigProvider,
    createSettingsRepo
} from "@school-gate/infra";
import { createSettingsService } from "@school-gate/core";

export function createRuntime() {
    const envInfo = loadEnv();
    const apiConfig = getApiConfig();
    const loggingConfig = getLoggingConfig();
    const dbFile = getCoreDbFile();
    const dbFilePath = path.resolve(envInfo.baseDir, dbFile);

    const dbClient = createDb(dbFilePath);
    const isDev = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev";
    const logger = isDev
        ? createLogger({
              name: apiConfig.logName,
              level: apiConfig.logLevel
          })
        : createFileLogger({
              name: apiConfig.logName,
              level: apiConfig.logLevel,
              filePath: path.join(loggingConfig.dir, `${apiConfig.logName}.log`),
              maxBytes: loggingConfig.maxBytes,
              retentionDays: loggingConfig.retentionDays
          });

    const runtimeConfigProvider = createRuntimeConfigProvider();
    const clock = { now: () => new Date() };
    const idGen = { nextId: () => crypto.randomUUID() };

    const settingsService = createSettingsService({
        settingsRepo: createSettingsRepo(dbClient.db),
        outbox: createOutbox(dbClient.db),
        idGen,
        runtimeConfigProvider,
        clock
    });

    const runtimeSettingsOverrides = settingsService.getRuntimeSettings();
    const accessCfg = getAccessEventsWorkerConfig(runtimeSettingsOverrides.accessEvents);
    const monitoringCfg = getMonitoringConfig(runtimeSettingsOverrides.monitoring);
    const monitoringOpsCfg = getMonitoringOpsConfig();
    const botClientCfg = getBotClientConfig();

    const apiBaseUrl = monitoringOpsCfg.apiUrl.replace(/\/$/, "");
    const deviceServiceBaseUrl = monitoringOpsCfg.deviceServiceUrl.replace(/\/$/, "");
    const botBaseUrl = monitoringOpsCfg.botUrl.replace(/\/$/, "");

    const componentsProvider = createMonitoringComponentsProvider({
        httpTargets: [
            {
                componentId: "api",
                url: `${apiBaseUrl}/health`,
                timeoutMs: monitoringOpsCfg.httpTimeoutMs
            },
            {
                componentId: "device-service",
                url: `${deviceServiceBaseUrl}/health`,
                timeoutMs: monitoringOpsCfg.httpTimeoutMs
            },
            {
                componentId: "bot",
                url: `${botBaseUrl}/api/health`,
                timeoutMs: monitoringOpsCfg.httpTimeoutMs,
                headers: { authorization: `Bearer ${botClientCfg.internalToken}` }
            }
        ],
        deviceServiceClient: createDeviceServiceMonitoringHttpClient({
            baseUrl: monitoringOpsCfg.deviceServiceUrl,
            token: monitoringOpsCfg.deviceServiceToken,
            timeoutMs: monitoringOpsCfg.httpTimeoutMs
        }),
        clock: () => new Date()
    });

    return {
        envInfo,
        apiConfig,
        dbClient,
        logger,
        clock,
        idGen,
        settingsService,
        accessCfg,
        monitoringCfg,
        deviceServiceGatewayCfg: {
            baseUrl: monitoringOpsCfg.deviceServiceUrl,
            internalToken: monitoringOpsCfg.deviceServiceToken,
            timeoutMs: monitoringOpsCfg.httpTimeoutMs
        },
        botClientCfg: {
            baseUrl: botClientCfg.baseUrl,
            internalToken: botClientCfg.internalToken,
            timeoutMs: monitoringOpsCfg.httpTimeoutMs
        },
        componentsProvider,
        close: () => dbClient.close()
    };
}

export type ApiRuntime = ReturnType<typeof createRuntime>;
