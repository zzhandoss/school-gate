import { z } from "zod";

const positiveInt = z.coerce.number().int().positive();
const nonNegativeInt = z.coerce.number().int().min(0);

export const subscriptionRequestAdminSchema = z.object({
    id: z.string().min(1),
    tgUserId: z.string().min(1),
    iin: z.string().min(1),
    status: z.enum(["pending", "approved", "rejected"]),
    resolutionStatus: z.enum(["new", "ready_for_review", "needs_person"]),
    personId: z.string().min(1).nullable(),
    resolutionMessage: z.string().min(1).nullable(),
    resolvedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    reviewedAt: z.string().datetime().nullable(),
    reviewedBy: z.string().min(1).nullable(),
});

export const listPendingSubscriptionRequestsQuerySchema = z.object({
    limit: positiveInt.max(200),
    offset: nonNegativeInt.optional(),
    status: z.enum(["all", "pending", "approved", "rejected", "not_pending"]).optional(),
    only: z.enum(["all", "ready_for_review", "needs_person", "new"]).optional(),
    order: z.enum(["oldest", "newest"]).optional(),
});

export const listPendingSubscriptionRequestsResultSchema = z.object({
    requests: z.array(subscriptionRequestAdminSchema),
    page: z.object({
        limit: positiveInt,
        offset: nonNegativeInt,
        total: nonNegativeInt,
    }),
});

export const reviewSubscriptionRequestSchema = z.object({
    decision: z.enum(["approve", "reject"]),
    adminTgUserId: z.string().min(1),
});

export const reviewSubscriptionRequestResultSchema = z.object({
    requestId: z.string().min(1),
    status: z.enum(["approved", "rejected"]),
    personId: z.string().min(1).nullable(),
});

export const resolveSubscriptionRequestPersonSchema = z.object({
    personId: z.string().min(1)
});

export const resolveSubscriptionRequestPersonResultSchema = z.object({
    requestId: z.string().min(1),
    resolutionStatus: z.enum(["ready_for_review"]),
    personId: z.string().min(1)
});

export type SubscriptionRequestAdminDto = z.infer<typeof subscriptionRequestAdminSchema>;
export type ListPendingSubscriptionRequestsQueryDto = z.infer<
    typeof listPendingSubscriptionRequestsQuerySchema
>;
export type ListPendingSubscriptionRequestsResultDto = z.infer<
    typeof listPendingSubscriptionRequestsResultSchema
>;
export type ReviewSubscriptionRequestDto = z.infer<typeof reviewSubscriptionRequestSchema>;
export type ReviewSubscriptionRequestResultDto = z.infer<
    typeof reviewSubscriptionRequestResultSchema
>;
export type ResolveSubscriptionRequestPersonDto = z.infer<
    typeof resolveSubscriptionRequestPersonSchema
>;
export type ResolveSubscriptionRequestPersonResultDto = z.infer<
    typeof resolveSubscriptionRequestPersonResultSchema
>;
