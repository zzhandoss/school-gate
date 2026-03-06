import { z } from "zod";

export const deviceServiceIdentityGetUserPhotoSchema = z.object({
    target: z.object({
        mode: z.literal("device"),
        deviceId: z.string().min(1)
    }),
    userId: z.string().min(1)
});

export const deviceServiceIdentityPhotoSchema = z.object({
    deviceId: z.string().min(1),
    userId: z.string().min(1),
    photoData: z.array(z.string().min(1)).nullable().optional(),
    photoUrl: z.array(z.string().min(1)).nullable().optional(),
    faceData: z.array(z.string().min(1)).nullable().optional()
});

export const deviceServiceIdentityGetUserPhotoResultSchema = z.object({
    photo: deviceServiceIdentityPhotoSchema
});

export type DeviceServiceIdentityGetUserPhotoDto = z.infer<typeof deviceServiceIdentityGetUserPhotoSchema>;
export type DeviceServiceIdentityPhotoDto = z.infer<typeof deviceServiceIdentityPhotoSchema>;
export type DeviceServiceIdentityGetUserPhotoResultDto = z.infer<typeof deviceServiceIdentityGetUserPhotoResultSchema>;
