import { z } from "zod";

export const inviteRegistrationSchema = z
    .object({
        email: z.string().email("Enter a valid email address"),
        password: z.string().min(1, "Password is required"),
        confirmPassword: z.string().min(1, "Confirm your password"),
        name: z.string().trim().max(128, "Name is too long").optional()
    })
    .refine((value) => value.password === value.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords do not match"
    });

export type InviteRegistrationValues = z.infer<typeof inviteRegistrationSchema>;
