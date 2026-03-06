import { z } from "zod";
import {
    deviceServiceIdentityBulkCreateUsersResultSchema,
    deviceServiceIdentityWriteCardSchema,
    deviceServiceIdentityWriteDeviceResultSchema,
    deviceServiceIdentityWriteFaceSchema
} from "./deviceServiceIdentityWriteUsers.js";
import { deviceServiceIdentityPhotoSchema } from "./deviceServiceIdentityGetUserPhoto.js";

const personTerminalSyncBaseSchema = z.object({
    deviceIds: z.array(z.string().min(1)).min(1).optional(),
    terminalPersonId: z.string().min(1).optional(),
    displayName: z.string().min(1).nullable().optional(),
    userType: z.number().int().nullable().optional(),
    userStatus: z.number().int().nullable().optional(),
    authority: z.number().int().nullable().optional(),
    citizenIdNo: z.string().min(1).nullable().optional(),
    validFrom: z.string().min(1).nullable().optional(),
    validTo: z.string().min(1).nullable().optional(),
    card: deviceServiceIdentityWriteCardSchema.optional(),
    face: deviceServiceIdentityWriteFaceSchema.optional()
});

export const createPersonTerminalUsersSchema = personTerminalSyncBaseSchema.extend({
    deviceIds: z.array(z.string().min(1)).min(1)
});

export const updatePersonTerminalUsersSchema = personTerminalSyncBaseSchema;

export const bulkCreatePersonTerminalUsersSchema = z.object({
    personIds: z.array(z.string().min(1)).min(1).max(200),
    deviceIds: z.array(z.string().min(1)).min(1).max(200),
    validFrom: z.string().min(1).nullable().optional(),
    validTo: z.string().min(1).nullable().optional()
});

export const getPersonTerminalUserPhotoSchema = z.object({
    deviceId: z.string().min(1),
    userId: z.string().min(1).optional()
});

export const personTerminalSyncResultSchema = z.object({
    personId: z.string().min(1),
    total: z.number().int().nonnegative(),
    success: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    results: z.array(deviceServiceIdentityWriteDeviceResultSchema)
});

export const bulkPersonTerminalSyncResultSchema = z.object({
    totalPersons: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
    success: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    results: z.array(
        z.object({
            personId: z.string().min(1),
            userId: z.string().min(1),
            total: z.number().int().nonnegative(),
            success: z.number().int().nonnegative(),
            failed: z.number().int().nonnegative(),
            results: z.array(deviceServiceIdentityWriteDeviceResultSchema)
        })
    ),
    upstream: deviceServiceIdentityBulkCreateUsersResultSchema.optional()
});

export const personTerminalUserPhotoResultSchema = z.object({
    personId: z.string().min(1),
    photo: deviceServiceIdentityPhotoSchema
});

export type CreatePersonTerminalUsersDto = z.infer<typeof createPersonTerminalUsersSchema>;
export type UpdatePersonTerminalUsersDto = z.infer<typeof updatePersonTerminalUsersSchema>;
export type BulkCreatePersonTerminalUsersDto = z.infer<typeof bulkCreatePersonTerminalUsersSchema>;
export type GetPersonTerminalUserPhotoDto = z.infer<typeof getPersonTerminalUserPhotoSchema>;
export type PersonTerminalSyncResultDto = z.infer<typeof personTerminalSyncResultSchema>;
export type BulkPersonTerminalSyncResultDto = z.infer<typeof bulkPersonTerminalSyncResultSchema>;
export type PersonTerminalUserPhotoResultDto = z.infer<typeof personTerminalUserPhotoResultSchema>;
