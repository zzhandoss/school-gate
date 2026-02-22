import { z } from "zod";

export const apiErrorSchema = z.object({
    message: z.string().min(1),
    code: z.string().min(1),
    data: z.unknown().optional(),
});

export function apiSuccessSchema<TSchema extends z.ZodTypeAny>(dataSchema: TSchema) {
    return z.object({
        success: z.literal(true),
        data: dataSchema,
    });
}

export const apiFailureSchema = z.object({
    success: z.literal(false),
    error: apiErrorSchema,
});

export type ApiError = z.infer<typeof apiErrorSchema>;
export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = z.infer<typeof apiFailureSchema>;
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

