import { z } from "zod";

export const accessEventDirectionSchema = z.enum(["IN", "OUT"]);

export const accessEventIngestSchema = z.object({
    eventId: z.string().min(1),
    deviceId: z.string().min(1),
    direction: accessEventDirectionSchema,
    occurredAt: z.number().int().nonnegative(),
    terminalPersonId: z.string().min(1).nullable().optional(),
    iin: z.string().min(1).nullable().optional(),
    rawPayload: z.string().min(1).nullable().optional(),
});

export const accessEventIngestBatchSchema = z.object({
    events: z.array(accessEventIngestSchema).min(1),
});

export const accessEventIngestResultSchema = z.object({
    result: z.enum(["inserted", "duplicate"]),
    status: z.enum(["NEW", "UNMATCHED"]),
    personId: z.string().min(1).nullable(),
    accessEventId: z.string().min(1).nullable(),
});

export const accessEventIngestBatchResultItemSchema = accessEventIngestResultSchema.extend({
    eventId: z.string().min(1),
});

export const accessEventIngestBatchResultSchema = z.object({
    results: z.array(accessEventIngestBatchResultItemSchema),
});

export type AccessEventIngestInput = z.infer<typeof accessEventIngestSchema>;
export type AccessEventIngestBatchInput = z.infer<typeof accessEventIngestBatchSchema>;
export type AccessEventIngestResult = z.infer<typeof accessEventIngestResultSchema>;
export type AccessEventIngestBatchResult = z.infer<typeof accessEventIngestBatchResultSchema>;

