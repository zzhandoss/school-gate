type AdapterIdentityPhotoClient = {
    getUserPhoto(input: {
        target: { mode: "device"; deviceId: string };
        userId: string;
    }): Promise<{
        photo: {
            deviceId: string;
            userId: string;
            photoData?: string[] | null;
            photoUrl?: string[] | null;
            faceData?: string[] | null;
        };
    }>;
};

type DeviceIdentityPhotoAdapter = {
    adapterKey: string;
    baseUrl: string;
    mode: "active" | "draining";
};

type DeviceIdentityPhotoDevice = {
    deviceId: string;
    adapterKey: string;
    enabled: boolean;
};

export function createIdentityGetUserPhotoResolver(input: {
    listDevices: () => Promise<DeviceIdentityPhotoDevice[]> | DeviceIdentityPhotoDevice[];
    listAdapters: () => Promise<DeviceIdentityPhotoAdapter[]> | DeviceIdentityPhotoAdapter[];
    createAdapterClient: (baseUrl: string) => AdapterIdentityPhotoClient;
}) {
    return async function getUserPhoto(params: {
        target: { mode: "device"; deviceId: string };
        userId: string;
    }) {
        const [devices, adapters] = await Promise.all([input.listDevices(), input.listAdapters()]);
        const device = devices.find((entry) => entry.deviceId === params.target.deviceId);
        if (!device) {
            throw new Error("device_not_found: Device was not found");
        }
        if (!device.enabled) {
            throw new Error("device_disabled: Device is disabled");
        }

        const adapter = adapters.find((entry) => entry.adapterKey === device.adapterKey && entry.mode === "active");
        if (!adapter) {
            throw new Error("adapter_unavailable: Active adapter session not found");
        }

        const client = input.createAdapterClient(adapter.baseUrl);
        return client.getUserPhoto({
            target: params.target,
            userId: params.userId
        });
    };
}
