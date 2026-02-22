import { z } from "zod";

export const applyRetentionScheduleResultSchema = z.object({
    taskName: z.string().min(1),
    platform: z.string().min(1),
    pollMs: z.number().int().positive(),
    intervalMinutes: z.number().int().positive(),
});

export const removeRetentionScheduleResultSchema = z.object({
    taskName: z.string().min(1),
    platform: z.string().min(1),
    removed: z.boolean(),
});

export const runRetentionOnceResultSchema = z.object({
    accessEventsDeleted: z.number().int().min(0),
    auditLogsDeleted: z.number().int().min(0),
    accessEventsCutoff: z.string().datetime(),
    auditLogsCutoff: z.string().datetime(),
    batch: z.number().int().positive(),
    accessEventsDays: z.number().int().positive(),
    auditLogsDays: z.number().int().positive(),
});

export type ApplyRetentionScheduleResultDto = z.infer<typeof applyRetentionScheduleResultSchema>;
export type RemoveRetentionScheduleResultDto = z.infer<typeof removeRetentionScheduleResultSchema>;
export type RunRetentionOnceResultDto = z.infer<typeof runRetentionOnceResultSchema>;
