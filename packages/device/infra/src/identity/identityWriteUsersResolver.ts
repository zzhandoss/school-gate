import type { DeviceIdentityExportTarget } from "./identityExportUsersResolver.js";

type AdapterIdentityWriteClient = {
    writeUsers(input: {
        operation: "create" | "update";
        target: DeviceIdentityExportTarget;
        person: {
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
        };
    }): Promise<{
        results: Array<{
            deviceId: string;
            operation: "create" | "update";
            status: "success" | "failed";
            steps: {
                accessUser: "success" | "failed" | "skipped";
                accessCard: "success" | "failed" | "skipped";
                accessFace: "success" | "failed" | "skipped";
            };
            errorCode?: string | null;
            errorMessage?: string | null;
        }>;
    }>;
};

type DeviceIdentityWriteAdapter = {
    adapterKey: string;
    baseUrl: string;
    mode: "active" | "draining";
};

type DeviceIdentityWriteDevice = {
    deviceId: string;
    adapterKey: string;
    enabled: boolean;
};

function getRequestedDeviceIds(
    devices: DeviceIdentityWriteDevice[],
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

export function createIdentityWriteUsersResolver(input: {
    listDevices: () => Promise<DeviceIdentityWriteDevice[]> | DeviceIdentityWriteDevice[];
    listAdapters: () => Promise<DeviceIdentityWriteAdapter[]> | DeviceIdentityWriteAdapter[];
    createAdapterClient: (baseUrl: string) => AdapterIdentityWriteClient;
}) {
    return async function writeUsers(params: {
        operation: "create" | "update";
        target: DeviceIdentityExportTarget;
        person: {
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
        };
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
        const failures: Array<{
            deviceId: string;
            operation: "create" | "update";
            status: "success" | "failed";
            steps: {
                accessUser: "success" | "failed" | "skipped";
                accessCard: "success" | "failed" | "skipped";
                accessFace: "success" | "failed" | "skipped";
            };
            errorCode?: string | null;
            errorMessage?: string | null;
        }> = [];

        for (const deviceId of requestedDeviceIds) {
            const device = deviceById.get(deviceId);
            if (!device) {
                failures.push({
                    deviceId,
                    operation: params.operation,
                    status: "failed",
                    steps: { accessUser: "failed", accessCard: "skipped", accessFace: "skipped" },
                    errorCode: "device_not_found",
                    errorMessage: "Device was not found"
                });
                continue;
            }
            if (!device.enabled) {
                failures.push({
                    deviceId,
                    operation: params.operation,
                    status: "failed",
                    steps: { accessUser: "failed", accessCard: "skipped", accessFace: "skipped" },
                    errorCode: "device_disabled",
                    errorMessage: "Device is disabled"
                });
                continue;
            }

            const adapter = adapterByKey.get(device.adapterKey);
            if (!adapter) {
                failures.push({
                    deviceId,
                    operation: params.operation,
                    status: "failed",
                    steps: { accessUser: "failed", accessCard: "skipped", accessFace: "skipped" },
                    errorCode: "adapter_unavailable",
                    errorMessage: "Active adapter session not found"
                });
                continue;
            }
            const current = groupedByAdapter.get(device.adapterKey) ?? [];
            current.push(deviceId);
            groupedByAdapter.set(device.adapterKey, current);
        }

        const results = [...failures];

        for (const [adapterKey, deviceIds] of groupedByAdapter) {
            const adapter = adapterByKey.get(adapterKey);
            if (!adapter) {
                continue;
            }

            try {
                const client = input.createAdapterClient(adapter.baseUrl);
                const response = await client.writeUsers({
                    operation: params.operation,
                    target: deviceIds.length === 1 ? { mode: "device", deviceId: deviceIds[0]! } : { mode: "devices", deviceIds },
                    person: params.person
                });
                results.push(...response.results);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                for (const deviceId of deviceIds) {
                    results.push({
                        deviceId,
                        operation: params.operation,
                        status: "failed",
                        steps: { accessUser: "failed", accessCard: "skipped", accessFace: "skipped" },
                        errorCode: "identity_write_failed",
                        errorMessage: message
                    });
                }
            }
        }

        results.sort((left, right) => left.deviceId.localeCompare(right.deviceId));
        return { results };
    };
}
