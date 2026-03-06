import { z } from "zod";

export const deviceServiceIdentityExportTargetSchema = z.discriminatedUnion("mode", [
    z.object({
        mode: z.literal("device"),
        deviceId: z.string().min(1)
    }),
    z.object({
        mode: z.literal("devices"),
        deviceIds: z.array(z.string().min(1)).min(1)
    }),
    z.object({
        mode: z.literal("allAssigned")
    })
]);

export const deviceServiceIdentityExportUsersSchema = z.object({
    target: deviceServiceIdentityExportTargetSchema,
    view: z.enum(["flat", "grouped"]).default("grouped"),
    limit: z.coerce.number().int().positive().max(500).default(100),
    offset: z.coerce.number().int().nonnegative().default(0),
    includeCards: z.boolean().default(true)
});

export const deviceServiceIdentityExportUserSchema = z.object({
    deviceId: z.string().min(1),
    terminalPersonId: z.string().min(1),
    displayName: z.string().min(1).nullable().optional(),
    userType: z.string().min(1).nullable().optional(),
    userStatus: z.string().min(1).nullable().optional(),
    authority: z.string().min(1).nullable().optional(),
    citizenIdNo: z.string().min(1).nullable().optional(),
    validFrom: z.string().min(1).nullable().optional(),
    validTo: z.string().min(1).nullable().optional(),
    cardNo: z.string().min(1).nullable().optional(),
    cardName: z.string().min(1).nullable().optional(),
    sourceSummary: z.array(z.string().min(1)).default([]),
    rawUserPayload: z.string().min(1).nullable().optional(),
    rawCardPayload: z.string().min(1).nullable().optional()
});

export const deviceServiceIdentityExportDeviceResultSchema = z.object({
    deviceId: z.string().min(1),
    exportedCount: z.number().int().nonnegative(),
    failed: z.boolean(),
    hasMore: z.boolean().default(false),
    errorCode: z.string().min(1).nullable().optional(),
    errorMessage: z.string().min(1).nullable().optional()
});

export const deviceServiceIdentityExportUsersFlatResultSchema = z.object({
    view: z.literal("flat"),
    users: z.array(deviceServiceIdentityExportUserSchema),
    devices: z.array(deviceServiceIdentityExportDeviceResultSchema)
});

export const deviceServiceIdentityExportUsersGroupedDeviceSchema = z.object({
    deviceId: z.string().min(1),
    exportedCount: z.number().int().nonnegative(),
    failed: z.boolean(),
    hasMore: z.boolean().default(false),
    errorCode: z.string().min(1).nullable().optional(),
    errorMessage: z.string().min(1).nullable().optional(),
    users: z.array(deviceServiceIdentityExportUserSchema).default([])
});

export const deviceServiceIdentityExportUsersGroupedResultSchema = z.object({
    view: z.literal("grouped"),
    devices: z.array(deviceServiceIdentityExportUsersGroupedDeviceSchema)
});

export const deviceServiceIdentityExportUsersResultSchema = z.union([
    deviceServiceIdentityExportUsersFlatResultSchema,
    deviceServiceIdentityExportUsersGroupedResultSchema
]);

export type DeviceServiceIdentityExportTargetDto = z.infer<typeof deviceServiceIdentityExportTargetSchema>;
export type DeviceServiceIdentityExportUsersDto = z.infer<typeof deviceServiceIdentityExportUsersSchema>;
export type DeviceServiceIdentityExportUserDto = z.infer<typeof deviceServiceIdentityExportUserSchema>;
export type DeviceServiceIdentityExportDeviceResultDto = z.infer<typeof deviceServiceIdentityExportDeviceResultSchema>;
export type DeviceServiceIdentityExportUsersFlatResultDto = z.infer<typeof deviceServiceIdentityExportUsersFlatResultSchema>;
export type DeviceServiceIdentityExportUsersGroupedDeviceDto = z.infer<typeof deviceServiceIdentityExportUsersGroupedDeviceSchema>;
export type DeviceServiceIdentityExportUsersGroupedResultDto = z.infer<typeof deviceServiceIdentityExportUsersGroupedResultSchema>;
export type DeviceServiceIdentityExportUsersResultDto = z.infer<typeof deviceServiceIdentityExportUsersResultSchema>;
