export type DeviceIdentityExportTarget =
    | { mode: "device"; deviceId: string }
    | { mode: "devices"; deviceIds: string[] }
    | { mode: "allAssigned" };

export type DeviceIdentityExportUser = {
    deviceId: string;
    terminalPersonId: string;
    sourceSummary: string[];
    displayName?: string | null;
    userType?: string | null;
    userStatus?: string | null;
    authority?: string | null;
    citizenIdNo?: string | null;
    validFrom?: string | null;
    validTo?: string | null;
    cardNo?: string | null;
    cardName?: string | null;
    rawUserPayload?: string | null;
    rawCardPayload?: string | null;
};

export type DeviceIdentityExportUsersResult =
    | {
        view: "flat";
        users: DeviceIdentityExportUser[];
        devices: Array<{
            deviceId: string;
            exportedCount: number;
            failed: boolean;
            hasMore: boolean;
            errorCode?: string | null;
            errorMessage?: string | null;
        }>;
    }
    | {
        view: "grouped";
        devices: Array<{
            deviceId: string;
            exportedCount: number;
            failed: boolean;
            hasMore: boolean;
            errorCode?: string | null;
            errorMessage?: string | null;
            users: DeviceIdentityExportUser[];
        }>;
    };

type AdapterIdentityExportClient = {
    exportUsers(input: {
        target: DeviceIdentityExportTarget;
        view: "flat" | "grouped";
        limit: number;
        offset: number;
        includeCards: boolean;
    }): Promise<DeviceIdentityExportUsersResult>;
};

type DeviceIdentityExportAdapter = {
    adapterKey: string;
    baseUrl: string;
    mode: "active" | "draining";
};

type DeviceIdentityExportDevice = {
    deviceId: string;
    adapterKey: string;
    enabled: boolean;
};

function getRequestedDeviceIds(
    devices: DeviceIdentityExportDevice[],
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

export function createIdentityExportUsersResolver(input: {
    listDevices: () => Promise<DeviceIdentityExportDevice[]> | DeviceIdentityExportDevice[];
    listAdapters: () => Promise<DeviceIdentityExportAdapter[]> | DeviceIdentityExportAdapter[];
    createAdapterClient: (baseUrl: string) => AdapterIdentityExportClient;
}) {
    return async function exportUsers(params: {
        target: DeviceIdentityExportTarget;
        view: "flat" | "grouped";
        limit: number;
        offset: number;
        includeCards: boolean;
    }): Promise<DeviceIdentityExportUsersResult> {
        const [devices, adapters] = await Promise.all([input.listDevices(), input.listAdapters()]);
        const deviceById = new Map(devices.map((device) => [device.deviceId, device]));
        const adapterByKey = new Map(
            adapters
                .filter((adapter) => adapter.mode === "active")
                .map((adapter) => [adapter.adapterKey, adapter])
        );

        const requestedDeviceIds = getRequestedDeviceIds(devices, params.target);
        const groupedByAdapter = new Map<string, string[]>();
        const failures = new Map<string, { errorCode: string; errorMessage: string }>();

        for (const deviceId of requestedDeviceIds) {
            const device = deviceById.get(deviceId);
            if (!device) {
                failures.set(deviceId, {
                    errorCode: "device_not_found",
                    errorMessage: "Device was not found"
                });
                continue;
            }
            if (!device.enabled) {
                failures.set(deviceId, {
                    errorCode: "device_disabled",
                    errorMessage: "Device is disabled"
                });
                continue;
            }

            const adapter = adapterByKey.get(device.adapterKey);
            if (!adapter) {
                failures.set(deviceId, {
                    errorCode: "adapter_unavailable",
                    errorMessage: "Active adapter session not found"
                });
                continue;
            }
            const current = groupedByAdapter.get(device.adapterKey) ?? [];
            current.push(deviceId);
            groupedByAdapter.set(device.adapterKey, current);
        }

        const flatUsers: DeviceIdentityExportUser[] = [];
        const groupedDevices: Array<{
            deviceId: string;
            exportedCount: number;
            failed: boolean;
            hasMore: boolean;
            errorCode?: string | null;
            errorMessage?: string | null;
            users: DeviceIdentityExportUser[];
        }> = [];

        for (const [deviceId, failure] of failures) {
            groupedDevices.push({
                deviceId,
                exportedCount: 0,
                failed: true,
                hasMore: false,
                errorCode: failure.errorCode,
                errorMessage: failure.errorMessage,
                users: []
            });
        }

        for (const [adapterKey, deviceIds] of groupedByAdapter) {
            const adapter = adapterByKey.get(adapterKey);
            if (!adapter) {
                continue;
            }
            try {
                const client = input.createAdapterClient(adapter.baseUrl);
                const result = await client.exportUsers({
                    target: deviceIds.length === 1 ? { mode: "device", deviceId: deviceIds[0]! } : { mode: "devices", deviceIds },
                    view: params.view,
                    limit: params.limit,
                    offset: params.offset,
                    includeCards: params.includeCards
                });

                if (result.view === "flat") {
                    flatUsers.push(
                        ...result.users.map((user) => ({
                            ...user,
                            sourceSummary: user.sourceSummary ?? []
                        }))
                    );
                    groupedDevices.push(
                        ...result.devices.map((device) => ({
                            ...device,
                            users: result.users
                                .filter((user) => user.deviceId === device.deviceId)
                                .map((user) => ({
                                    ...user,
                                    sourceSummary: user.sourceSummary ?? []
                                }))
                        }))
                    );
                } else {
                    groupedDevices.push(
                        ...result.devices.map((device) => ({
                            ...device,
                            users: device.users.map((user) => ({
                                ...user,
                                sourceSummary: user.sourceSummary ?? []
                            }))
                        }))
                    );
                    for (const device of result.devices) {
                        flatUsers.push(
                            ...device.users.map((user) => ({
                                ...user,
                                sourceSummary: user.sourceSummary ?? []
                            }))
                        );
                    }
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                for (const deviceId of deviceIds) {
                    groupedDevices.push({
                        deviceId,
                        exportedCount: 0,
                        failed: true,
                        hasMore: false,
                        errorCode: "identity_export_failed",
                        errorMessage: message,
                        users: []
                    });
                }
            }
        }

        groupedDevices.sort((left, right) => left.deviceId.localeCompare(right.deviceId));
        flatUsers.sort((left, right) => {
            const byDevice = left.deviceId.localeCompare(right.deviceId);
            if (byDevice !== 0) {
                return byDevice;
            }
            return left.terminalPersonId.localeCompare(right.terminalPersonId);
        });

        if (params.view === "flat") {
            return {
                view: "flat",
                users: flatUsers,
                devices: groupedDevices.map(({ users: _users, ...device }) => device)
            };
        }

        return {
            view: "grouped",
            devices: groupedDevices
        };
    };
}
