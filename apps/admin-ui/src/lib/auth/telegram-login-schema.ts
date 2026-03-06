import { z } from "zod";

export const requestTelegramLoginCodeSchema = z.object({
    email: z.string().email("validation.emailInvalid")
});

export type RequestTelegramLoginCodeValues = z.infer<
  typeof requestTelegramLoginCodeSchema
>;

export const telegramOtpLoginSchema = z.object({
    email: z.string().email("validation.emailInvalid"),
    code: z.string().regex(/^\d{6}$/, "validation.telegramCodeInvalid")
});

export type TelegramOtpLoginValues = z.infer<typeof telegramOtpLoginSchema>;
