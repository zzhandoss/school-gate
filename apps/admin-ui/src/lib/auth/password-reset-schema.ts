import { z } from "zod";

export const requestPasswordResetSchema = z.object({
    email: z.string().email("validation.emailInvalid")
});

export type RequestPasswordResetValues = z.infer<typeof requestPasswordResetSchema>;

export const confirmPasswordResetSchema = z
    .object({
        password: z.string().min(1, "validation.passwordRequired"),
        confirmPassword: z.string().min(1, "validation.confirmPasswordRequired")
    })
    .refine((value) => value.password === value.confirmPassword, {
        path: ["confirmPassword"],
        message: "validation.passwordsDoNotMatch"
    });

export type ConfirmPasswordResetValues = z.infer<typeof confirmPasswordResetSchema>;
