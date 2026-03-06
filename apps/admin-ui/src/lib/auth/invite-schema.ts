import { z } from "zod";

export const inviteRegistrationSchema = z
    .object({
        email: z.string().email("validation.emailInvalid"),
        password: z.string().min(1, "validation.passwordRequired"),
        confirmPassword: z.string().min(1, "validation.confirmPasswordRequired"),
        name: z.string().trim().max(128, "validation.nameTooLong").optional()
    })
    .refine((value) => value.password === value.confirmPassword, {
        path: ["confirmPassword"],
        message: "validation.passwordsDoNotMatch"
    });

export type InviteRegistrationValues = z.infer<typeof inviteRegistrationSchema>;
