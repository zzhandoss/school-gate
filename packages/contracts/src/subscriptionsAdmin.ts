import { z } from "zod";

export const subscriptionAdminSchema = z.object({
    id: z.string().min(1),
    tgUserId: z.string().min(1),
    personId: z.string().min(1),
    isActive: z.boolean(),
    createdAt: z.string().datetime(),
    person: z.object({
        id: z.string().min(1),
        iin: z.string().min(1),
        firstName: z.string().nullable(),
        lastName: z.string().nullable()
    }),
    parent: z.object({
        tgUserId: z.string().min(1),
        chatId: z.string().min(1)
    })
});

export const listSubscriptionsQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(200).default(50),
    offset: z.coerce.number().int().nonnegative().default(0),
    personId: z.string().min(1).optional(),
    tgUserId: z.string().min(1).optional(),
    onlyActive: z.coerce.boolean().optional()
});

export const listSubscriptionsResultSchema = z.object({
    subscriptions: z.array(subscriptionAdminSchema)
});

export const subscriptionActionResultSchema = z.object({
    subscriptionId: z.string().min(1),
    isActive: z.boolean()
});

export type SubscriptionAdminDto = z.infer<typeof subscriptionAdminSchema>;
export type ListSubscriptionsQueryDto = z.infer<typeof listSubscriptionsQuerySchema>;
export type ListSubscriptionsResultDto = z.infer<typeof listSubscriptionsResultSchema>;
export type SubscriptionActionResultDto = z.infer<typeof subscriptionActionResultSchema>;
