import type { DeviceIdentityExportTarget } from "./identityExportUsersResolver.js";

type BulkCreateAdapterClient = {
    bulkCreateUsers(input: {
        target: DeviceIdentityExportTarget;
        persons: Array<{
            userId: string;
            displayName: string;
            userType?: number | null | undefined;
            userStatus?: number | null | undefined;
            authority?: number | null | undefined;
            citizenIdNo?: string | null | undefined;
            password?: string | null | undefined;
            useTime?: number | null | undefined;
            isFirstEnter?: boolean | null | undefined;
            firstEnterDoors?: number[] | null | undefined;
            doors?: number[] | null | undefined;
            timeSections?: number[] | null | undefined;
            specialDaysSchedule?: unknown | null | undefined;
            validFrom?: string | null | undefined;
            validTo?: string | null | undefined;
            card?: {
                cardNo: string;
                cardName?: string | null | undefined;
                cardType?: number | null | undefined;
                cardStatus?: number | null | undefined;
            } | undefined;
            face?: {
                photosBase64?: string[] | null | undefined;
                photoUrls?: string[] | null | undefined;
            } | undefined;
        }>;
    }): Promise<{
        results: Array<{
            userId: string;
            deviceId: string;
            operation: "create";
            status: "success" | "failed" | "skipped";
            steps: {
                accessUser: "success" | "failed" | "skipped";
                accessCard: "success" | "failed" | "skipped";
                accessFace: "success" | "failed" | "skipped";
            };
            errorCode?: string | null;
            errorMessage?: string | null;
            skipCode?: string | null;
            skipMessage?: string | null;
        }>;
    }>;
};

type DeviceIdentityBulkCreateAdapter = {
    adapterKey: string;
    baseUrl: string;
    mode: "active" | "draining";
};

type DeviceIdentityBulkCreateDevice = {
    deviceId: string;
    adapterKey: string;
    enabled: boolean;
};

function getRequestedDeviceIds(
    devices: DeviceIdentityBulkCreateDevice[],
    target: DeviceIdentityExportTarget
): string[] {
    if (target.mode === "device") {
        return [target.deviceId];
    }
    if (target.mode === "devices") {
        return Array.from(new Set(target.deviceIds));
    }
    return devices.filter((device) => device.enabled).map((device) => device.deviceId);
}

export function createIdentityBulkCreateUsersResolver(input: {
    listDevices: () => Promise<DeviceIdentityBulkCreateDevice[]> | DeviceIdentityBulkCreateDevice[];
    listAdapters: () => Promise<DeviceIdentityBulkCreateAdapter[]> | DeviceIdentityBulkCreateAdapter[];
    createAdapterClient: (baseUrl: string) => BulkCreateAdapterClient;
}) {
    return async function bulkCreateUsers(params: {
        target: DeviceIdentityExportTarget;
        persons: Array<{
            userId: string;
            displayName: string;
            userType?: number | null | undefined;
            userStatus?: number | null | undefined;
            authority?: number | null | undefined;
            citizenIdNo?: string | null | undefined;
            password?: string | null | undefined;
            useTime?: number | null | undefined;
            isFirstEnter?: boolean | null | undefined;
            firstEnterDoors?: number[] | null | undefined;
            doors?: number[] | null | undefined;
            timeSections?: number[] | null | undefined;
            specialDaysSchedule?: unknown | null | undefined;
            validFrom?: string | null | undefined;
            validTo?: string | null | undefined;
            card?: {
                cardNo: string;
                cardName?: string | null | undefined;
                cardType?: number | null | undefined;
                cardStatus?: number | null | undefined;
            } | undefined;
            face?: {
                photosBase64?: string[] | null | undefined;
                photoUrls?: string[] | null | undefined;
            } | undefined;
        }>;
    }) {
        const [devices, adapters] = await Promise.all([input.listDevices(), input.listAdapters()]);
        const deviceById = new Map(devices.map((device) => [device.deviceId, device]));
        const adapterByKey = new Map(
            adapters
                .filter((adapter) => adapter.mode === "active")
                .map((adapter) => [adapter.adapterKey, adapter])
        );

        const requestedDeviceIds = getRequestedDeviceIds(devices, params.target);
        const groupedByAdapter = new Map<string, string[]>();
        const results: Array<{
            userId: string;
            deviceId: string;
            operation: "create";
            status: "success" | "failed" | "skipped";
            steps: {
                accessUser: "success" | "failed" | "skipped";
                accessCard: "success" | "failed" | "skipped";
                accessFace: "success" | "failed" | "skipped";
            };
            errorCode?: string | null;
            errorMessage?: string | null;
            skipCode?: string | null;
            skipMessage?: string | null;
        }> = [];

        for (const deviceId of requestedDeviceIds) {
            const device = deviceById.get(deviceId);
            if (!device) {
                for (const person of params.persons) {
                    results.push({
                        userId: person.userId,
                        deviceId,
                        operation: "create",
                        status: "failed",
                        steps: { accessUser: "failed", accessCard: "skipped", accessFace: "skipped" },
                        errorCode: "device_not_found",
                        errorMessage: "Device was not found"
                    });
                }
                continue;
            }
            if (!device.enabled) {
                for (const person of params.persons) {
                    results.push({
                        userId: person.userId,
                        deviceId,
                        operation: "create",
                        status: "failed",
                        steps: { accessUser: "failed", accessCard: "skipped", accessFace: "skipped" },
                        errorCode: "device_disabled",
                        errorMessage: "Device is disabled"
                    });
                }
                continue;
            }

            const adapter = adapterByKey.get(device.adapterKey);
            if (!adapter) {
                for (const person of params.persons) {
                    results.push({
                        userId: person.userId,
                        deviceId,
                        operation: "create",
                        status: "failed",
                        steps: { accessUser: "failed", accessCard: "skipped", accessFace: "skipped" },
                        errorCode: "adapter_unavailable",
                        errorMessage: "Active adapter session not found"
                    });
                }
                continue;
            }

            const current = groupedByAdapter.get(device.adapterKey) ?? [];
            current.push(deviceId);
            groupedByAdapter.set(device.adapterKey, current);
        }

        for (const [adapterKey, deviceIds] of groupedByAdapter) {
            const adapter = adapterByKey.get(adapterKey);
            if (!adapter) {
                continue;
            }

            try {
                const client = input.createAdapterClient(adapter.baseUrl);
                const response = await client.bulkCreateUsers({
                    target: deviceIds.length === 1 ? { mode: "device", deviceId: deviceIds[0]! } : { mode: "devices", deviceIds },
                    persons: params.persons
                });
                results.push(...response.results);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                for (const person of params.persons) {
                    for (const deviceId of deviceIds) {
                        results.push({
                            userId: person.userId,
                            deviceId,
                            operation: "create",
                            status: "failed",
                            steps: { accessUser: "failed", accessCard: "skipped", accessFace: "skipped" },
                            errorCode: "identity_write_failed",
                            errorMessage: message
                        });
                    }
                }
            }
        }

        results.sort((left, right) => {
            const byUserId = left.userId.localeCompare(right.userId);
            return byUserId !== 0 ? byUserId : left.deviceId.localeCompare(right.deviceId);
        });
        return { results };
    };
}
