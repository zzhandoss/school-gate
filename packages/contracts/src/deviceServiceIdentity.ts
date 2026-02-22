import { z } from "zod";

export const deviceServiceIdentityFindSchema = z.object({
    identityKey: z.string().min(1),
    identityValue: z.string().min(1),
    deviceId: z.string().min(1).optional(),
    limit: z.coerce.number().int().positive().default(1).optional(),
});

export const deviceServiceIdentityMatchSchema = z.object({
    deviceId: z.string().min(1),
    adapterKey: z.string().min(1),
    terminalPersonId: z.string().min(1),
    firstName: z.string().min(1).nullable().optional(),
    lastName: z.string().min(1).nullable().optional(),
    score: z.number().nullable().optional(),
    rawPayload: z.string().min(1).nullable().optional(),
    displayName: z.string().min(1).nullable().optional(),
    source: z.string().min(1).nullable().optional(),
    userType: z.string().min(1).nullable().optional(),
});

export const deviceServiceIdentityErrorSchema = z.object({
    adapterKey: z.string().min(1),
    deviceId: z.string().min(1),
    message: z.string().min(1),
});

export const deviceServiceIdentityFindResultSchema = z.object({
    identityKey: z.string().min(1),
    identityValue: z.string().min(1),
    matches: z.array(deviceServiceIdentityMatchSchema),
    diagnostics: z.object({
        adaptersScanned: z.number().int().nonnegative(),
        devicesScanned: z.number().int().nonnegative(),
        devicesEligible: z.number().int().nonnegative(),
        requestsSent: z.number().int().nonnegative(),
        errors: z.number().int().nonnegative(),
    }),
    errors: z.array(deviceServiceIdentityErrorSchema),
});

export type DeviceServiceIdentityFindDto = z.infer<typeof deviceServiceIdentityFindSchema>;
export type DeviceServiceIdentityMatchDto = z.infer<typeof deviceServiceIdentityMatchSchema>;
export type DeviceServiceIdentityFindResultDto = z.infer<typeof deviceServiceIdentityFindResultSchema>;
