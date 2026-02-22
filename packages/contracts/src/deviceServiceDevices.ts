import { z } from "zod";
const deviceDirectionSchema = z.enum(["IN", "OUT"]);

export const deviceServiceDeviceSchema = z.object({
    deviceId: z.string().min(1),
    name: z.string().min(1),
    direction: deviceDirectionSchema,
    adapterKey: z.string().min(1),
    enabled: z.boolean(),
    settingsJson: z.string().nullable(),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1)
});

export const listDeviceServiceDevicesResultSchema = z.object({
    devices: z.array(deviceServiceDeviceSchema)
});

export const getDeviceServiceDeviceResultSchema = z.object({
    device: deviceServiceDeviceSchema
});

export const upsertDeviceServiceDeviceSchema = z.object({
    deviceId: z.string().min(1),
    name: z.string().min(1),
    direction: deviceDirectionSchema,
    adapterKey: z.string().min(1),
    enabled: z.boolean().default(true),
    settingsJson: z.string().nullable().optional()
});

export const updateDeviceServiceDeviceSchema = z.object({
    name: z.string().min(1).optional(),
    direction: deviceDirectionSchema.optional(),
    adapterKey: z.string().min(1).optional(),
    enabled: z.boolean().optional(),
    settingsJson: z.string().nullable().optional()
});

export const setDeviceServiceDeviceEnabledSchema = z.object({
    enabled: z.boolean()
});

export type DeviceServiceDeviceDto = z.infer<typeof deviceServiceDeviceSchema>;
export type ListDeviceServiceDevicesResultDto = z.infer<typeof listDeviceServiceDevicesResultSchema>;
export type GetDeviceServiceDeviceResultDto = z.infer<typeof getDeviceServiceDeviceResultSchema>;
export type UpsertDeviceServiceDeviceDto = z.infer<typeof upsertDeviceServiceDeviceSchema>;
export type UpdateDeviceServiceDeviceDto = z.infer<typeof updateDeviceServiceDeviceSchema>;
export type SetDeviceServiceDeviceEnabledDto = z.infer<typeof setDeviceServiceDeviceEnabledSchema>;
