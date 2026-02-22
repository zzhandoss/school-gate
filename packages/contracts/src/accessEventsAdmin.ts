import { z } from "zod";

export const accessEventStatusSchema = z.enum(["NEW", "PROCESSING", "PROCESSED", "FAILED_RETRY", "UNMATCHED", "ERROR"]);

export const accessEventItemSchema = z.object({
    id: z.string().min(1),
    deviceId: z.string().min(1),
    direction: z.enum(["IN", "OUT"]),
    occurredAt: z.string().min(1),
    terminalPersonId: z.string().min(1).nullable(),
    iin: z.string().min(1).nullable(),
    status: accessEventStatusSchema,
    attempts: z.number().int().nonnegative(),
    lastError: z.string().nullable(),
    person: z.object({
        id: z.string().min(1),
        iin: z.string().min(1),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
    }).nullable(),
    processedAt: z.string().min(1).nullable(),
    createdAt: z.string().min(1),
});

export const listAccessEventsQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(200).default(20),
    offset: z.coerce.number().int().nonnegative().default(0),
    status: accessEventStatusSchema.optional(),
    direction: z.enum(["IN", "OUT"]).optional(),
    deviceId: z.string().min(1).optional(),
    iin: z.string().min(1).optional(),
    terminalPersonId: z.string().min(1).optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
});

export const listAccessEventsResultSchema = z.object({
    events: z.array(accessEventItemSchema),
    page: z.object({
        limit: z.number().int().positive(),
        offset: z.number().int().nonnegative(),
        total: z.number().int().nonnegative(),
    }),
});

export const unmatchedAccessEventSchema = z.object({
    id: z.string().min(1),
    deviceId: z.string().min(1),
    direction: z.enum(["IN", "OUT"]),
    occurredAt: z.string().min(1),
    terminalPersonId: z.string().min(1).nullable(),
    iin: z.string().min(1).nullable(),
    status: z.enum(["UNMATCHED"]),
    createdAt: z.string().min(1),
});

export const listUnmatchedAccessEventsResultSchema = z.object({
    events: z.array(unmatchedAccessEventSchema),
});

export const mapTerminalIdentitySchema = z.object({
    personId: z.string().min(1),
    deviceId: z.string().min(1),
    terminalPersonId: z.string().min(1),
});

export const mapTerminalIdentityResultSchema = z.object({
    status: z.enum(["linked", "already_linked"]),
    updatedEvents: z.number().int().nonnegative(),
});

export type UnmatchedAccessEventDto = z.infer<typeof unmatchedAccessEventSchema>;
export type AccessEventItemDto = z.infer<typeof accessEventItemSchema>;
export type AccessEventStatusDto = z.infer<typeof accessEventStatusSchema>;
export type ListAccessEventsQueryDto = z.infer<typeof listAccessEventsQuerySchema>;
export type ListAccessEventsResultDto = z.infer<typeof listAccessEventsResultSchema>;
export type ListUnmatchedAccessEventsResultDto = z.infer<typeof listUnmatchedAccessEventsResultSchema>;
export type MapTerminalIdentityDto = z.infer<typeof mapTerminalIdentitySchema>;
export type MapTerminalIdentityResultDto = z.infer<typeof mapTerminalIdentityResultSchema>;
