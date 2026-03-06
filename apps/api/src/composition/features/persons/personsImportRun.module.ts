import type { DeviceServiceGatewayModule } from "../../../delivery/http/routes/deviceServiceGateway.routes.js";
import type { PersonsImportModule } from "../../../delivery/http/routes/persons/persons.types.js";
import {
    computeDirectoryEntryHash,
    createPersonsImportStorageHttpError,
    isMissingPersonsImportStorageError,
    resolveImportIin
} from "./personsImport.shared.js";
import { collectImportRunDeviceUsers, type ImportRunDeviceSummary } from "./personsImportRun.helpers.js";

type PersonsImportRunDeps = {
    nextId: () => string;
    now: () => Date;
    deviceServiceGateway: Pick<DeviceServiceGatewayModule, "listDevices" | "exportUsers">;
    terminalDirectorySyncRunsRepo: {
        create: (input: {
            id: string;
            requestedByAdminId: string | null;
            status: "running";
            includeCards: boolean;
            pageSize: number;
            targetJson: string;
            deviceCount: number;
        }) => Promise<void>;
        complete: (input: {
            id: string;
            status: "completed" | "partial" | "failed";
            processedDeviceCount: number;
            entryCount: number;
            errorCount: number;
            summaryJson: string;
            finishedAt: Date;
        }) => Promise<void>;
    };
    terminalDirectoryEntriesRepo: {
        markAllNotPresentForDevice: (input: { deviceId: string }) => Promise<void>;
        upsert: (input: {
            id: string;
            deviceId: string;
            terminalPersonId: string;
            iin: string | null;
            displayName: string | null;
            userType: string | null;
            userStatus: string | null;
            authority: string | null;
            validFrom: string | null;
            validTo: string | null;
            cardNo: string | null;
            cardName: string | null;
            sourceSummary: string[];
            rawUserPayload: string | null;
            rawCardPayload: string | null;
            payloadHash: string;
            lastSeenAt: Date;
            lastSyncRunId: string;
        }) => Promise<void>;
    };
    enqueueAudit: (input: {
        actorId: string;
        action: string;
        entityType: string;
        entityId: string;
        meta: Record<string, unknown>;
    }) => void;
};

export function createPersonsImportRunModule(
    deps: PersonsImportRunDeps
): Pick<PersonsImportModule, "createImportRun"> {
    return {
        createImportRun: async ({ body, adminId, admin, authorizationHeader }) => {
            try {
                const startedAt = deps.now();
                const runId = deps.nextId();
                const devicesResult = await deps.deviceServiceGateway.listDevices({ authorizationHeader, admin });
                const deviceSettingsById = new Map(
                    devicesResult.devices.map((device) => [device.deviceId, device.settingsJson])
                );

                await deps.terminalDirectorySyncRunsRepo.create({
                    id: runId,
                    requestedByAdminId: adminId ?? null,
                    status: "running",
                    includeCards: body.includeCards,
                    pageSize: body.pageSize,
                    targetJson: JSON.stringify({ deviceIds: body.deviceIds }),
                    deviceCount: body.deviceIds.length
                });

                let processedDeviceCount = 0;
                let entryCount = 0;
                let errorCount = 0;
                const deviceSummaries: ImportRunDeviceSummary[] = [];

                for (const deviceId of body.deviceIds) {
                    const { users: collectedUsers, summary } = await collectImportRunDeviceUsers({
                        deviceId,
                        pageSize: body.pageSize,
                        includeCards: body.includeCards,
                        authorizationHeader,
                        deviceServiceGateway: deps.deviceServiceGateway
                    });

                    if (summary.failed) {
                        errorCount += 1;
                        deviceSummaries.push(summary);
                        continue;
                    }

                    await deps.terminalDirectoryEntriesRepo.markAllNotPresentForDevice({ deviceId });
                    for (const user of collectedUsers) {
                        const normalizedIin = resolveImportIin({
                            settingsJson: deviceSettingsById.get(user.deviceId) ?? null,
                            citizenIdNo: user.citizenIdNo,
                            rawUserPayload: user.rawUserPayload,
                            rawCardPayload: user.rawCardPayload,
                            terminalPersonId: user.terminalPersonId
                        });

                        await deps.terminalDirectoryEntriesRepo.upsert({
                            id: deps.nextId(),
                            deviceId: user.deviceId,
                            terminalPersonId: user.terminalPersonId,
                            iin: normalizedIin,
                            displayName: user.displayName ?? null,
                            userType: user.userType ?? null,
                            userStatus: user.userStatus ?? null,
                            authority: user.authority ?? null,
                            validFrom: user.validFrom ?? null,
                            validTo: user.validTo ?? null,
                            cardNo: user.cardNo ?? null,
                            cardName: user.cardName ?? null,
                            sourceSummary: user.sourceSummary ?? [],
                            rawUserPayload: user.rawUserPayload ?? null,
                            rawCardPayload: user.rawCardPayload ?? null,
                            payloadHash: computeDirectoryEntryHash({
                                deviceId: user.deviceId,
                                terminalPersonId: user.terminalPersonId,
                                iin: normalizedIin,
                                displayName: user.displayName ?? null,
                                userType: user.userType ?? null,
                                userStatus: user.userStatus ?? null,
                                authority: user.authority ?? null,
                                validFrom: user.validFrom ?? null,
                                validTo: user.validTo ?? null,
                                cardNo: user.cardNo ?? null,
                                cardName: user.cardName ?? null,
                                sourceSummary: user.sourceSummary ?? [],
                                rawUserPayload: user.rawUserPayload ?? null,
                                rawCardPayload: user.rawCardPayload ?? null
                            }),
                            lastSeenAt: startedAt,
                            lastSyncRunId: runId
                        });
                    }

                    processedDeviceCount += 1;
                    entryCount += collectedUsers.length;
                    deviceSummaries.push(summary);
                }

                const status =
                    processedDeviceCount === 0 && errorCount > 0
                        ? "failed"
                        : errorCount > 0
                            ? "partial"
                            : "completed";
                const finishedAt = deps.now();
                const summary = {
                    deviceCount: body.deviceIds.length,
                    processedDeviceCount,
                    entryCount,
                    errorCount,
                    devices: deviceSummaries
                };

                await deps.terminalDirectorySyncRunsRepo.complete({
                    id: runId,
                    status,
                    processedDeviceCount,
                    entryCount,
                    errorCount,
                    summaryJson: JSON.stringify(summary),
                    finishedAt
                });

                deps.enqueueAudit({
                    actorId: adminId ?? "system:terminal_directory_sync",
                    action: "terminal_directory_sync_completed",
                    entityType: "terminal_directory_sync_run",
                    entityId: runId,
                    meta: summary
                });

                return {
                    run: {
                        id: runId,
                        status,
                        requestedByAdminId: adminId ?? null,
                        includeCards: body.includeCards,
                        pageSize: body.pageSize,
                        deviceIds: body.deviceIds,
                        startedAt: startedAt.toISOString(),
                        finishedAt: finishedAt.toISOString(),
                        summary: {
                            deviceCount: body.deviceIds.length,
                            processedDeviceCount,
                            entryCount,
                            errorCount,
                            errors: deviceSummaries
                                .filter((device) => device.failed)
                                .map((device) => ({
                                    deviceId: device.deviceId,
                                    errorCode: device.errorCode ?? null,
                                    errorMessage: device.errorMessage ?? null
                                }))
                        }
                    }
                };
            } catch (error) {
                if (isMissingPersonsImportStorageError(error)) {
                    throw createPersonsImportStorageHttpError();
                }

                throw error;
            }
        }
    };
}
