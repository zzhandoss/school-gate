import type {
    DeviceAdapterItem,
    DeviceItem,
    DeviceMonitoringSnapshot,
    DeviceUpdateInput,
    DeviceUpsertInput
} from "./types";
import { requestApi } from "@/lib/api/client";

type ListDevicesResponse = {
    devices: Array<DeviceItem>
};

type GetDeviceResponse = {
    device: DeviceItem
};

type ListAdaptersResponse = {
    adapters: Array<DeviceAdapterItem>
};

export async function listDevices() {
    const response = await requestApi<ListDevicesResponse>("/api/ds/devices");
    return response.devices;
}

export async function getDevice(deviceId: string) {
    const response = await requestApi<GetDeviceResponse>(`/api/ds/devices/${deviceId}`);
    return response.device;
}

export async function createDevice(input: DeviceUpsertInput) {
    await requestApi("/api/ds/devices", {
        method: "PUT",
        body: input
    });
}

export async function updateDevice(deviceId: string, input: DeviceUpdateInput) {
    await requestApi(`/api/ds/devices/${deviceId}`, {
        method: "PATCH",
        body: input
    });
}

export async function setDeviceEnabled(deviceId: string, enabled: boolean) {
    await requestApi(`/api/ds/devices/${deviceId}/enabled`, {
        method: "PATCH",
        body: { enabled }
    });
}

export async function removeDevice(deviceId: string) {
    await requestApi(`/api/ds/devices/${deviceId}`, {
        method: "DELETE"
    });
}

export async function listAdapters() {
    const response = await requestApi<ListAdaptersResponse>("/api/ds/adapters");
    return response.adapters;
}

export async function getMonitoringSnapshot() {
    return requestApi<DeviceMonitoringSnapshot>("/api/ds/monitoring");
}
