import { z } from "zod";

const positiveInt = z.number().int().positive();

export const setRuntimeSettingsSchema = z.object({
    worker: z
        .object({
            pollMs: positiveInt.optional(),
            batch: positiveInt.optional(),
            autoResolvePersonByIin: z.boolean().optional()
        })
        .optional(),
    outbox: z
        .object({
            pollMs: positiveInt.optional(),
            batch: positiveInt.optional(),
            maxAttempts: positiveInt.optional(),
            leaseMs: positiveInt.optional(),
            processingBy: z.string().min(1).optional()
        })
        .optional(),
    accessEvents: z
        .object({
            pollMs: positiveInt.optional(),
            batch: positiveInt.optional(),
            retryDelayMs: positiveInt.optional(),
            leaseMs: positiveInt.optional(),
            maxAttempts: positiveInt.optional(),
            processingBy: z.string().min(1).optional()
        })
        .optional(),
    retention: z
        .object({
            pollMs: positiveInt.optional(),
            batch: positiveInt.optional(),
            accessEventsDays: positiveInt.optional(),
            auditLogsDays: positiveInt.optional()
        })
        .optional(),
    monitoring: z
        .object({
            workerTtlMs: positiveInt.optional()
        })
        .optional(),
    notifications: z
        .object({
            parentTemplate: z.string().min(1).optional(),
            parentMaxAgeMs: positiveInt.optional(),
            alertMaxAgeMs: positiveInt.optional()
        })
        .optional()
});

export type SetRuntimeSettingsDto = z.infer<typeof setRuntimeSettingsSchema>;

const baseFieldSchema = {
    key: z.string().min(1),
    updatedAt: z.string().datetime().optional()
};

export const runtimeNumberFieldSchema = z.object({
    ...baseFieldSchema,
    env: z.number(),
    effective: z.number(),
    db: z.number().optional()
});

export const runtimeStringFieldSchema = z.object({
    ...baseFieldSchema,
    env: z.string(),
    effective: z.string(),
    db: z.string().optional()
});

export const runtimeBooleanFieldSchema = z.object({
    ...baseFieldSchema,
    env: z.boolean(),
    effective: z.boolean(),
    db: z.boolean().optional()
});

export const runtimeSettingsSnapshotSchema = z.object({
    worker: z.object({
        pollMs: runtimeNumberFieldSchema,
        batch: runtimeNumberFieldSchema,
        autoResolvePersonByIin: runtimeBooleanFieldSchema
    }),
    outbox: z.object({
        pollMs: runtimeNumberFieldSchema,
        batch: runtimeNumberFieldSchema,
        maxAttempts: runtimeNumberFieldSchema,
        leaseMs: runtimeNumberFieldSchema,
        processingBy: runtimeStringFieldSchema
    }),
    accessEvents: z.object({
        pollMs: runtimeNumberFieldSchema,
        batch: runtimeNumberFieldSchema,
        retryDelayMs: runtimeNumberFieldSchema,
        leaseMs: runtimeNumberFieldSchema,
        maxAttempts: runtimeNumberFieldSchema,
        processingBy: runtimeStringFieldSchema
    }),
    retention: z.object({
        pollMs: runtimeNumberFieldSchema,
        batch: runtimeNumberFieldSchema,
        accessEventsDays: runtimeNumberFieldSchema,
        auditLogsDays: runtimeNumberFieldSchema
    }),
    monitoring: z.object({
        workerTtlMs: runtimeNumberFieldSchema
    }),
    notifications: z.object({
        parentTemplate: runtimeStringFieldSchema,
        parentMaxAgeMs: runtimeNumberFieldSchema,
        alertMaxAgeMs: runtimeNumberFieldSchema
    })
});

export type RuntimeSettingsSnapshotDto = z.infer<typeof runtimeSettingsSnapshotSchema>;
