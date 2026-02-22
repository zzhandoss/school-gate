export type DeviceIdentityFindDevice = {
    deviceId: string;
    adapterKey: string;
    enabled: boolean;
    settingsJson: string | null;
};

export type DeviceIdentityFindAdapter = {
    adapterKey: string;
    baseUrl: string;
    mode: "active" | "draining";
};

export type DeviceIdentityFindMatch = {
    deviceId: string;
    adapterKey: string;
    terminalPersonId: string;
    firstName?: string | null;
    lastName?: string | null;
    score?: number | null;
    rawPayload?: string | null;
    displayName?: string | null;
    source?: string | null;
    userType?: string | null;
};

export type DeviceIdentityFindError = {
    adapterKey: string;
    deviceId: string;
    message: string;
};

export type DeviceIdentityFindResult = {
    identityKey: string;
    identityValue: string;
    matches: DeviceIdentityFindMatch[];
    diagnostics: {
        adaptersScanned: number;
        devicesScanned: number;
        devicesEligible: number;
        requestsSent: number;
        errors: number;
    };
    errors: DeviceIdentityFindError[];
};

export type AdapterIdentityLookupClient = {
    findIdentity: (input: {
        deviceId: string;
        identityKey: string;
        identityValue: string;
        limit?: number;
    }) => Promise<{
        terminalPersonId: string;
        firstName?: string | null;
        lastName?: string | null;
        score?: number | null;
        rawPayload?: string | null;
        displayName?: string | null;
        source?: string | null;
        userType?: string | null;
    } | null>;
};

function parseSettings(settingsJson: string | null): Record<string, unknown> | null {
    if (!settingsJson) {
        return null;
    }
    try {
        const parsed = JSON.parse(settingsJson);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return null;
        }
        return parsed as Record<string, unknown>;
    } catch {
        return null;
    }
}

function hasIdentityMapping(settings: Record<string, unknown> | null, identityKey: string): boolean {
    if (!settings) {
        return false;
    }
    const mappings = settings.identityQueryMappings;
    if (!mappings || typeof mappings !== "object" || Array.isArray(mappings)) {
        return false;
    }
    const item = (mappings as Record<string, unknown>)[identityKey];
    return !!item && typeof item === "object" && !Array.isArray(item);
}

export function createIdentityFindResolver(input: {
    listDevices: () => Promise<DeviceIdentityFindDevice[]> | DeviceIdentityFindDevice[];
    listAdapters: () => Promise<DeviceIdentityFindAdapter[]> | DeviceIdentityFindAdapter[];
    createAdapterClient: (baseUrl: string) => AdapterIdentityLookupClient;
}) {
    return async function findIdentity(params: {
        identityKey: string;
        identityValue: string;
        deviceId?: string;
        limit?: number;
    }): Promise<DeviceIdentityFindResult> {
        const limit = params.limit && params.limit > 0 ? params.limit : 1;
        const [devices, adapters] = await Promise.all([input.listDevices(), input.listAdapters()]);
        const activeAdapterByKey = new Map(
            adapters
                .filter((adapter) => adapter.mode === "active")
                .map((adapter) => [adapter.adapterKey, adapter.baseUrl])
        );
        const errors: DeviceIdentityFindError[] = [];
        const matches: DeviceIdentityFindMatch[] = [];
        const seen = new Set<string>();
        let requestsSent = 0;

        const enabledDevices = devices.filter((device) =>
            device.enabled && (!params.deviceId || device.deviceId === params.deviceId)
        );
        for (const device of enabledDevices) {
            const settings = parseSettings(device.settingsJson);
            if (!hasIdentityMapping(settings, params.identityKey)) {
                continue;
            }
            const baseUrl = activeAdapterByKey.get(device.adapterKey);
            if (!baseUrl) {
                errors.push({
                    adapterKey: device.adapterKey,
                    deviceId: device.deviceId,
                    message: "Active adapter session not found",
                });
                continue;
            }
            try {
                const client = input.createAdapterClient(baseUrl);
                requestsSent += 1;
                const found = await client.findIdentity({
                    deviceId: device.deviceId,
                    identityKey: params.identityKey,
                    identityValue: params.identityValue,
                    limit,
                });
                if (!found) {
                    continue;
                }
                const dedupKey = `${device.deviceId}:${found.terminalPersonId}`;
                if (seen.has(dedupKey)) {
                    continue;
                }
                seen.add(dedupKey);
                matches.push({
                    deviceId: device.deviceId,
                    adapterKey: device.adapterKey,
                    terminalPersonId: found.terminalPersonId,
                    ...(found.firstName !== undefined ? { firstName: found.firstName } : {}),
                    ...(found.lastName !== undefined ? { lastName: found.lastName } : {}),
                    ...(found.score !== undefined ? { score: found.score } : {}),
                    ...(found.rawPayload !== undefined ? { rawPayload: found.rawPayload } : {}),
                    ...(found.displayName !== undefined ? { displayName: found.displayName } : {}),
                    ...(found.source !== undefined ? { source: found.source } : {}),
                    ...(found.userType !== undefined ? { userType: found.userType } : {}),
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                errors.push({
                    adapterKey: device.adapterKey,
                    deviceId: device.deviceId,
                    message,
                });
            }
        }

        const devicesEligible = enabledDevices.filter((device) =>
            hasIdentityMapping(parseSettings(device.settingsJson), params.identityKey)
        ).length;

        return {
            identityKey: params.identityKey,
            identityValue: params.identityValue,
            matches,
            diagnostics: {
                adaptersScanned: activeAdapterByKey.size,
                devicesScanned: enabledDevices.length,
                devicesEligible,
                requestsSent,
                errors: errors.length,
            },
            errors,
        };
    };
}
