import type { AppLogger } from "@school-gate/infra";
import type { AdapterAssignment } from "@school-gate/device/core/usecases/listAdapterAssignments";
import type {
    RecordDeviceAccessEventInput,
    RecordDeviceAccessEventResult,
} from "@school-gate/device/core/usecases/recordAccessEvent";
import { AdapterInstanceActiveError } from "../../../adapterRegistry.js";
import type { AdapterRegistry, AdapterSession } from "../../../adapterRegistry.js";
import type { AdapterEventsInput, AdapterHeartbeatInput, AdapterRegisterInput } from "../../../contracts.js";
import type { BackfillRunnerResult } from "../../../backfillRunner.js";
import { HttpError, conflictError, notFoundError } from "../../../delivery/http/errors/httpError.js";
import { ensureDeviceSettingsSchema } from "../../../json-schema/deviceSettingsSchema.js";

export type AdapterIngressConfig = {
    heartbeatIntervalMs: number;
    batchLimit: number;
};

export type AdapterIngressModule = {
    register: (input: AdapterRegisterInput) => Promise<{
        adapterId: string;
        instanceKey: string;
        instanceName: string;
        mode: "active" | "draining";
        heartbeatIntervalMs: number;
        batchLimit: number;
        devices: AdapterAssignment[];
    }>;
    heartbeat: (input: AdapterHeartbeatInput) => Promise<{
        adapterId: string;
        instanceKey: string;
        instanceName: string;
        mode: "active" | "draining";
        heartbeatIntervalMs: number;
        batchLimit: number;
        devices: AdapterAssignment[];
    }>;
    ingestEvents: (input: AdapterEventsInput) => {
        results: {
            eventId: string;
            result: RecordDeviceAccessEventResult["result"];
            deviceEventId: string | null;
        }[];
    };
};

type CreateAdapterIngressModuleInput = {
    config: AdapterIngressConfig;
    logger: AppLogger;
    registry: AdapterRegistry;
    listAssignments: (adapterKey: string) => { devices: AdapterAssignment[] };
    recordAccessEvent: (input: RecordDeviceAccessEventInput) => RecordDeviceAccessEventResult;
    runBackfill: (session: AdapterSession) => Promise<BackfillRunnerResult>;
};

function toAssignmentsResponse(
    config: AdapterIngressConfig,
    registry: AdapterRegistry,
    listAssignments: (adapterKey: string) => { devices: AdapterAssignment[] },
    adapterId: string,
    mode: "active" | "draining"
) {
    const session = registry.getSession(adapterId);
    const instanceKey = session?.instanceKey ?? adapterId;
    const instanceName = session?.instanceName ?? instanceKey;

    if (mode !== "active") {
        return {
            adapterId,
            instanceKey,
            instanceName,
            mode,
            heartbeatIntervalMs: config.heartbeatIntervalMs,
            batchLimit: config.batchLimit,
            devices: [],
        };
    }

    if (!session) {
        return {
            adapterId,
            instanceKey,
            instanceName,
            mode: "draining" as const,
            heartbeatIntervalMs: config.heartbeatIntervalMs,
            batchLimit: config.batchLimit,
            devices: [],
        };
    }

    return {
        adapterId,
        instanceKey,
        instanceName,
        mode,
        heartbeatIntervalMs: config.heartbeatIntervalMs,
        batchLimit: config.batchLimit,
        devices: listAssignments(session.vendorKey).devices,
    };
}

function triggerBackfill(
    logger: AppLogger,
    runBackfill: (session: AdapterSession) => Promise<BackfillRunnerResult>,
    session: AdapterSession
) {
    void runBackfill(session).catch((err) => {
        logger.error({ err }, "device-service backfill failed");
    });
}

export function createAdapterIngressModule(input: CreateAdapterIngressModuleInput): AdapterIngressModule {
    return {
        register: async (payload) => {
            const capabilities = payload.capabilities ?? [];
            const instanceKey = payload.instanceKey ?? payload.vendorKey;
            const instanceName = payload.instanceName ?? instanceKey;
            const deviceSettingsSchema =
                payload.deviceSettingsSchema === undefined
                    ? undefined
                    : ensureDeviceSettingsSchema(payload.deviceSettingsSchema);

            const base = {
                vendorKey: payload.vendorKey,
                instanceKey,
                instanceName,
                baseUrl: payload.baseUrl,
                retentionMs: payload.retentionMs,
                capabilities,
                ...(deviceSettingsSchema === undefined ? {} : { deviceSettingsSchema }),
            };

            let session: AdapterSession;
            try {
                session = input.registry.register(payload.version ? { ...base, version: payload.version } : base);
            } catch (error) {
                if (error instanceof AdapterInstanceActiveError) {
                    throw conflictError(
                        "adapter_instance_active",
                        "Adapter instance is already active"
                    );
                }
                throw error;
            }
            triggerBackfill(input.logger, input.runBackfill, session);
            return toAssignmentsResponse(
                input.config,
                input.registry,
                input.listAssignments,
                session.adapterId,
                session.mode
            );
        },
        heartbeat: async (payload) => {
            const session = input.registry.heartbeat(payload.adapterId);
            if (!session) {
                throw notFoundError("adapter_not_found", "Adapter not found");
            }

            triggerBackfill(input.logger, input.runBackfill, session);
            return toAssignmentsResponse(
                input.config,
                input.registry,
                input.listAssignments,
                session.adapterId,
                session.mode
            );
        },
        ingestEvents: (payload) => {
            if (!input.registry.isActive(payload.adapterId)) {
                throw conflictError("adapter_inactive", "Adapter is not active");
            }

            const session = input.registry.getSession(payload.adapterId);
            if (!session) {
                throw notFoundError("adapter_not_found", "Adapter not found");
            }

            const assignments = input.listAssignments(session.vendorKey).devices;
            const directionByDeviceId = new Map(assignments.map((item) => [item.deviceId, item.direction]));

            for (const event of payload.events) {
                const direction = directionByDeviceId.get(event.deviceId);
                if (!direction) {
                    throw new HttpError({
                        status: 403,
                        code: "device_not_assigned",
                        message: "Device not assigned",
                    });
                }
                if (direction !== event.direction) {
                    throw conflictError("direction_mismatch", "Device direction mismatch");
                }
            }

            return {
                results: payload.events.map((event) => {
                    const result = input.recordAccessEvent({
                        deviceId: event.deviceId,
                        eventId: event.eventId,
                        direction: event.direction,
                        occurredAt: new Date(event.occurredAt),
                        terminalPersonId: event.terminalPersonId ?? null,
                        rawPayload: event.rawPayload ?? null,
                    });

                    return {
                        eventId: event.eventId,
                        result: result.result,
                        deviceEventId: result.deviceEventId,
                    };
                }),
            };
        },
    };
}
