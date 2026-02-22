import { z } from "zod";

export const requestTelegramLoginCodeSchema = z.object({
    email: z.string().email("Enter a valid email address")
});

export type RequestTelegramLoginCodeValues = z.infer<
  typeof requestTelegramLoginCodeSchema
>;

export const telegramOtpLoginSchema = z.object({
    email: z.string().email("Enter a valid email address"),
    code: z.string().regex(/^\d{6}$/, "Enter 6-digit code")
});

export type TelegramOtpLoginValues = z.infer<typeof telegramOtpLoginSchema>;
