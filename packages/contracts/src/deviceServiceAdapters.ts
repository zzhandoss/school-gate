import { z } from "zod";

export const deviceServiceAdapterCapabilitiesSchema = z.array(z.string());

export const deviceServiceAdapterSchema = z.object({
    adapterId: z.string().min(1),
    vendorKey: z.string().min(1),
    instanceKey: z.string().min(1),
    instanceName: z.string().min(1),
    baseUrl: z.string().min(1),
    retentionMs: z.number().int().positive(),
    capabilities: deviceServiceAdapterCapabilitiesSchema,
    deviceSettingsSchema: z.record(z.string(), z.unknown()).nullable().optional(),
    version: z.string().min(1).optional(),
    mode: z.enum(["active", "draining"]),
    registeredAt: z.string().min(1),
    lastSeenAt: z.string().min(1)
});

export const listDeviceServiceAdaptersResultSchema = z.object({
    adapters: z.array(deviceServiceAdapterSchema)
});

export type DeviceServiceAdapterDto = z.infer<typeof deviceServiceAdapterSchema>;
export type ListDeviceServiceAdaptersResultDto = z.infer<typeof listDeviceServiceAdaptersResultSchema>;
