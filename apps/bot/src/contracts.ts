import { z } from "zod";

export const sendNotificationSchema = z.object({
    tgUserId: z.string().min(1),
    text: z.string().min(1)
});

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
