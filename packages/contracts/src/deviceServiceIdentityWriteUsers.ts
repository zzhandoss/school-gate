import { z } from "zod";
import { deviceServiceIdentityExportTargetSchema } from "./deviceServiceIdentityExportUsers.js";

export const deviceServiceIdentityWriteCardSchema = z.object({
    cardNo: z.string().min(1),
    cardName: z.string().min(1).nullable().optional(),
    cardType: z.number().int().nullable().optional(),
    cardStatus: z.number().int().nullable().optional()
});

export const deviceServiceIdentityWriteFaceSchema = z.object({
    photosBase64: z.array(z.string().min(1)).min(1).nullable().optional(),
    photoUrls: z.array(z.string().min(1)).min(1).nullable().optional()
});

export const deviceServiceIdentityWritePersonSchema = z.object({
    userId: z.string().min(1),
    displayName: z.string().min(1),
    userType: z.number().int().nullable().optional(),
    userStatus: z.number().int().nullable().optional(),
    authority: z.number().int().nullable().optional(),
    citizenIdNo: z.string().min(1).nullable().optional(),
    password: z.string().min(1).nullable().optional(),
    useTime: z.number().int().nullable().optional(),
    isFirstEnter: z.boolean().nullable().optional(),
    firstEnterDoors: z.array(z.number().int()).nullable().optional(),
    doors: z.array(z.number().int()).nullable().optional(),
    timeSections: z.array(z.number().int()).nullable().optional(),
    specialDaysSchedule: z.unknown().nullable().optional(),
    validFrom: z.string().min(1).nullable().optional(),
    validTo: z.string().min(1).nullable().optional(),
    card: deviceServiceIdentityWriteCardSchema.optional(),
    face: deviceServiceIdentityWriteFaceSchema.optional()
});

export const deviceServiceIdentityWriteUsersSchema = z.object({
    target: deviceServiceIdentityExportTargetSchema,
    person: deviceServiceIdentityWritePersonSchema
});

export const deviceServiceIdentityBulkCreateUsersSchema = z.object({
    target: deviceServiceIdentityExportTargetSchema,
    persons: z.array(deviceServiceIdentityWritePersonSchema).min(1).max(200)
});

export const deviceServiceIdentityWriteStepStatusSchema = z.enum(["success", "failed", "skipped"]);

export const deviceServiceIdentityWriteDeviceResultSchema = z.object({
    deviceId: z.string().min(1),
    operation: z.enum(["create", "update"]),
    status: z.enum(["success", "failed", "skipped"]),
    steps: z.object({
        accessUser: deviceServiceIdentityWriteStepStatusSchema,
        accessCard: deviceServiceIdentityWriteStepStatusSchema,
        accessFace: deviceServiceIdentityWriteStepStatusSchema
    }),
    errorCode: z.string().min(1).nullable().optional(),
    errorMessage: z.string().min(1).nullable().optional(),
    skipCode: z.string().min(1).nullable().optional(),
    skipMessage: z.string().min(1).nullable().optional()
});

export const deviceServiceIdentityWriteUsersResultSchema = z.object({
    results: z.array(deviceServiceIdentityWriteDeviceResultSchema)
});

export const deviceServiceIdentityBulkCreateUsersResultSchema = z.object({
    results: z.array(
        deviceServiceIdentityWriteDeviceResultSchema.extend({
            userId: z.string().min(1)
        })
    )
});

export type DeviceServiceIdentityWriteCardDto = z.infer<typeof deviceServiceIdentityWriteCardSchema>;
export type DeviceServiceIdentityWriteFaceDto = z.infer<typeof deviceServiceIdentityWriteFaceSchema>;
export type DeviceServiceIdentityWritePersonDto = z.infer<typeof deviceServiceIdentityWritePersonSchema>;
export type DeviceServiceIdentityWriteUsersDto = z.infer<typeof deviceServiceIdentityWriteUsersSchema>;
export type DeviceServiceIdentityBulkCreateUsersDto = z.infer<typeof deviceServiceIdentityBulkCreateUsersSchema>;
export type DeviceServiceIdentityWriteStepStatusDto = z.infer<typeof deviceServiceIdentityWriteStepStatusSchema>;
export type DeviceServiceIdentityWriteDeviceResultDto = z.infer<typeof deviceServiceIdentityWriteDeviceResultSchema>;
export type DeviceServiceIdentityWriteUsersResultDto = z.infer<typeof deviceServiceIdentityWriteUsersResultSchema>;
export type DeviceServiceIdentityBulkCreateUsersResultDto = z.infer<typeof deviceServiceIdentityBulkCreateUsersResultSchema>;
