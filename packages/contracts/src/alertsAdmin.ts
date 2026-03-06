import { z } from "zod";

export const alertRuleTypeSchema = z.enum([
    "worker_stale",
    "outbox_backlog",
    "bot_down",
    "access_event_lag",
    "error_spike",
    "device_service_down",
    "adapter_down"
]);

export const alertSeveritySchema = z.enum(["warning", "critical"]);

const workerStaleConfigSchema = z.object({
    workerId: z.string().min(1).optional()
}).strict();

const outboxBacklogConfigSchema = z
    .object({
        source: z.enum(["core", "device_service"]),
        maxNew: z.number().int().positive().optional(),
        maxOldestAgeMs: z.number().int().positive().optional()
    })
    .strict()
    .refine((value) => value.maxNew !== undefined || value.maxOldestAgeMs !== undefined, {
        message: "maxNew or maxOldestAgeMs is required"
    });

const botDownConfigSchema = z.object({}).strict();

const accessEventLagConfigSchema = z.object({
    maxOldestAgeMs: z.number().int().positive()
}).strict();

const errorSpikeConfigSchema = z.object({
    source: z.enum(["access_events", "outbox"]),
    increaseBy: z.number().int().positive()
}).strict();

const deviceServiceDownConfigSchema = z.object({}).strict();

const adapterDownConfigSchema = z.object({
    adapterId: z.string().min(1).optional(),
    vendorKey: z.string().min(1).optional()
}).strict();

const alertRuleConfigSchema = z.union([
    workerStaleConfigSchema,
    outboxBacklogConfigSchema,
    botDownConfigSchema,
    accessEventLagConfigSchema,
    errorSpikeConfigSchema,
    deviceServiceDownConfigSchema,
    adapterDownConfigSchema
]);

const alertConfigByType = {
    worker_stale: workerStaleConfigSchema,
    outbox_backlog: outboxBacklogConfigSchema,
    bot_down: botDownConfigSchema,
    access_event_lag: accessEventLagConfigSchema,
    error_spike: errorSpikeConfigSchema,
    device_service_down: deviceServiceDownConfigSchema,
    adapter_down: adapterDownConfigSchema
} as const;

export const createAlertRuleSchema = z
    .object({
        name: z.string().min(1),
        type: alertRuleTypeSchema,
        severity: alertSeveritySchema,
        isEnabled: z.boolean(),
        config: alertRuleConfigSchema
    })
    .superRefine((value, ctx) => {
        const schema = alertConfigByType[value.type];
        const parsed = schema.safeParse(value.config);
        if (!parsed.success) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Alert rule config is invalid",
                path: ["config"]
            });
        }
    });

export const updateAlertRuleSchema = z.object({
    name: z.string().min(1).optional(),
    severity: alertSeveritySchema.optional(),
    isEnabled: z.boolean().optional(),
    config: z.unknown().optional()
});

export const alertRuleSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    type: alertRuleTypeSchema,
    severity: alertSeveritySchema,
    isEnabled: z.boolean(),
    config: alertRuleConfigSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
});

export const createAlertRuleResultSchema = z.object({
    ruleId: z.string().min(1)
});

export const listAlertRulesQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(200).default(50),
    offset: z.coerce.number().int().nonnegative().default(0),
    onlyEnabled: z.coerce.boolean().optional()
});

export const listAlertRulesResultSchema = z.object({
    rules: z.array(alertRuleSchema)
});

export const alertSubscriptionSchema = z.object({
    adminId: z.string().min(1),
    ruleId: z.string().min(1),
    isEnabled: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
});

export const setAlertSubscriptionSchema = z.object({
    adminId: z.string().min(1),
    ruleId: z.string().min(1),
    isEnabled: z.boolean()
});

export const listAlertSubscriptionsQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(200).default(50),
    offset: z.coerce.number().int().nonnegative().default(0),
    adminId: z.string().min(1).optional(),
    ruleId: z.string().min(1).optional(),
    onlyEnabled: z.coerce.boolean().optional()
});

export const listAlertSubscriptionsResultSchema = z.object({
    subscriptions: z.array(alertSubscriptionSchema)
});

export const alertEventStatusSchema = z.enum(["triggered", "resolved"]);

export const alertEventSchema = z.object({
    id: z.string().min(1),
    ruleId: z.string().min(1),
    snapshotId: z.string().min(1).nullable(),
    status: alertEventStatusSchema,
    severity: alertSeveritySchema,
    message: z.string().min(1),
    details: z.record(z.string(), z.any()).nullable(),
    createdAt: z.iso.datetime()
});

export const listAlertEventsQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(200).default(50),
    offset: z.coerce.number().int().nonnegative().default(0),
    ruleId: z.string().min(1).optional(),
    status: alertEventStatusSchema.optional(),
    from: z.iso.datetime().optional(),
    to: z.iso.datetime().optional()
});

export const listAlertEventsResultSchema = z.object({
    events: z.array(alertEventSchema),
    page: z.object({
        limit: z.number().int().positive(),
        offset: z.number().int().nonnegative(),
        total: z.number().int().nonnegative()
    })
});

export const deleteAlertRuleResultSchema = z.object({
    ruleId: z.string().min(1),
    deleted: z.literal(true)
});

export type CreateAlertRuleDto = z.infer<typeof createAlertRuleSchema>;
export type UpdateAlertRuleDto = z.infer<typeof updateAlertRuleSchema>;
export type AlertRuleDto = z.infer<typeof alertRuleSchema>;
export type ListAlertRulesQueryDto = z.infer<typeof listAlertRulesQuerySchema>;
export type ListAlertRulesResultDto = z.infer<typeof listAlertRulesResultSchema>;
export type AlertSubscriptionDto = z.infer<typeof alertSubscriptionSchema>;
export type SetAlertSubscriptionDto = z.infer<typeof setAlertSubscriptionSchema>;
export type ListAlertSubscriptionsQueryDto = z.infer<typeof listAlertSubscriptionsQuerySchema>;
export type ListAlertSubscriptionsResultDto = z.infer<typeof listAlertSubscriptionsResultSchema>;
export type AlertEventDto = z.infer<typeof alertEventSchema>;
export type ListAlertEventsQueryDto = z.infer<typeof listAlertEventsQuerySchema>;
export type ListAlertEventsResultDto = z.infer<typeof listAlertEventsResultSchema>;
export type DeleteAlertRuleResultDto = z.infer<typeof deleteAlertRuleResultSchema>;
