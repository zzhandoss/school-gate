import { z } from "zod";

export const auditLogSchema = z.object({
    id: z.string().min(1),
    eventId: z.string().nullable(),
    actorId: z.string().min(1),
    action: z.string().min(1),
    entityType: z.string().min(1),
    entityId: z.string().min(1),
    meta: z.record(z.string(), z.any()).nullable(),
    at: z.iso.datetime()
});

export const listAuditLogsQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(200).default(50),
    offset: z.coerce.number().int().nonnegative().default(0),
    actorId: z.string().min(1).optional(),
    entityType: z.string().min(1).optional(),
    entityId: z.string().min(1).optional(),
    action: z.string().min(1).optional(),
    from: z.iso.datetime().optional(),
    to: z.iso.datetime().optional()
});

export const listAuditLogsResultSchema = z.object({
    logs: z.array(auditLogSchema),
    page: z.object({
        limit: z.number().int().positive(),
        offset: z.number().int().nonnegative(),
        total: z.number().int().nonnegative()
    })
});

export type AuditLogDto = z.infer<typeof auditLogSchema>;
export type ListAuditLogsQueryDto = z.infer<typeof listAuditLogsQuerySchema>;
export type ListAuditLogsResultDto = z.infer<typeof listAuditLogsResultSchema>;
