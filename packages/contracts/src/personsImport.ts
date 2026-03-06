import { z } from "zod";

export const personImportTargetSchema = z.object({
    deviceIds: z.array(z.string().min(1)).min(1),
    includeCards: z.boolean().default(true),
    pageSize: z.coerce.number().int().positive().max(500).default(100)
});

export const personImportRunSummarySchema = z.object({
    deviceCount: z.number().int().nonnegative(),
    processedDeviceCount: z.number().int().nonnegative(),
    entryCount: z.number().int().nonnegative(),
    errorCount: z.number().int().nonnegative(),
    errors: z.array(z.object({
        deviceId: z.string().min(1),
        errorCode: z.string().min(1).nullable(),
        errorMessage: z.string().min(1).nullable()
    }))
});

export const personImportRunSchema = z.object({
    id: z.string().min(1),
    status: z.enum(["running", "completed", "failed", "partial"]),
    requestedByAdminId: z.string().min(1).nullable(),
    includeCards: z.boolean(),
    pageSize: z.number().int().positive(),
    deviceIds: z.array(z.string().min(1)),
    startedAt: z.string().min(1),
    finishedAt: z.string().min(1).nullable(),
    summary: personImportRunSummarySchema
});

export const createPersonsImportRunSchema = personImportTargetSchema;

export const createPersonsImportRunResultSchema = z.object({
    run: personImportRunSchema
});

export const personImportCandidateStatusSchema = z.enum([
    "ready_create",
    "ready_link",
    "already_linked",
    "conflict",
    "missing_iin",
    "stale_terminal_record"
]);

export const personImportCandidateEntrySchema = z.object({
    directoryEntryId: z.string().min(1),
    deviceId: z.string().min(1),
    terminalPersonId: z.string().min(1),
    iin: z.string().min(1).nullable(),
    displayName: z.string().min(1).nullable(),
    userType: z.string().min(1).nullable(),
    userStatus: z.string().min(1).nullable(),
    authority: z.string().min(1).nullable(),
    validFrom: z.string().min(1).nullable(),
    validTo: z.string().min(1).nullable(),
    cardNo: z.string().min(1).nullable(),
    cardName: z.string().min(1).nullable(),
    sourceSummary: z.array(z.string().min(1)),
    linkedPersonId: z.string().min(1).nullable(),
    linkedPersonName: z.string().min(1).nullable(),
    linkedPersonIin: z.string().min(1).nullable(),
    isPresentInLastSync: z.boolean(),
    lastSeenAt: z.string().min(1),
    stateReason: z.string().min(1)
});

export const personImportCandidateGroupSchema = z.object({
    groupKey: z.string().min(1),
    status: personImportCandidateStatusSchema,
    iin: z.string().min(1).nullable(),
    displayName: z.string().min(1).nullable(),
    suggestedPersonId: z.string().min(1).nullable(),
    suggestedPersonName: z.string().min(1).nullable(),
    suggestedPersonIin: z.string().min(1).nullable(),
    warnings: z.array(z.string().min(1)),
    entries: z.array(personImportCandidateEntrySchema)
});

export const listPersonsImportCandidatesQuerySchema = z.object({
    status: z
        .preprocess((value) => {
            if (Array.isArray(value)) {
                return value;
            }
            if (typeof value === "string" && value.trim().length > 0) {
                return value.split(",").map((item) => item.trim()).filter(Boolean);
            }
            return undefined;
        }, z.array(personImportCandidateStatusSchema))
        .optional(),
    deviceId: z.string().min(1).optional(),
    iin: z.string().regex(/^\d{0,12}$/).optional(),
    query: z.string().trim().min(1).max(128).optional(),
    includeStale: z.coerce.boolean().default(true),
    limit: z.coerce.number().int().positive().max(200).default(20),
    offset: z.coerce.number().int().nonnegative().default(0)
});

export const listPersonsImportCandidatesResultSchema = z.object({
    groups: z.array(personImportCandidateGroupSchema),
    page: z.object({
        limit: z.number().int().positive(),
        offset: z.number().int().nonnegative(),
        total: z.number().int().nonnegative()
    }),
    summary: z.record(personImportCandidateStatusSchema, z.number().int().nonnegative())
});

export const personImportApplyOperationSchema = z.object({
    type: z.enum(["create_person_and_link", "link_existing", "reassign_identity", "skip"]),
    directoryEntryIds: z.array(z.string().min(1)).min(1),
    targetPersonId: z.string().min(1).optional(),
    expectedCurrentPersonId: z.string().min(1).nullable().optional(),
    personDraft: z
        .object({
            iin: z.string().regex(/^\d{12}$/),
            firstName: z.string().trim().min(1).max(128).nullable().optional(),
            lastName: z.string().trim().min(1).max(128).nullable().optional()
        })
        .optional()
});

export const applyPersonsImportSchema = z.object({
    operations: z.array(personImportApplyOperationSchema).min(1)
});

export const personImportApplyOperationResultSchema = z.object({
    type: z.enum(["create_person_and_link", "link_existing", "reassign_identity", "skip"]),
    directoryEntryIds: z.array(z.string().min(1)),
    status: z.enum(["applied", "skipped", "conflict", "error"]),
    personId: z.string().min(1).nullable().optional(),
    message: z.string().min(1).nullable().optional()
});

export const applyPersonsImportResultSchema = z.object({
    total: z.number().int().nonnegative(),
    applied: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative(),
    conflicts: z.number().int().nonnegative(),
    errors: z.number().int().nonnegative(),
    results: z.array(personImportApplyOperationResultSchema)
});

export type PersonImportTargetDto = z.infer<typeof personImportTargetSchema>;
export type PersonImportRunSummaryDto = z.infer<typeof personImportRunSummarySchema>;
export type PersonImportRunDto = z.infer<typeof personImportRunSchema>;
export type CreatePersonsImportRunDto = z.infer<typeof createPersonsImportRunSchema>;
export type CreatePersonsImportRunResultDto = z.infer<typeof createPersonsImportRunResultSchema>;
export type PersonImportCandidateStatusDto = z.infer<typeof personImportCandidateStatusSchema>;
export type PersonImportCandidateEntryDto = z.infer<typeof personImportCandidateEntrySchema>;
export type PersonImportCandidateGroupDto = z.infer<typeof personImportCandidateGroupSchema>;
export type ListPersonsImportCandidatesQueryDto = z.infer<typeof listPersonsImportCandidatesQuerySchema>;
export type ListPersonsImportCandidatesResultDto = z.infer<typeof listPersonsImportCandidatesResultSchema>;
export type PersonImportApplyOperationDto = z.infer<typeof personImportApplyOperationSchema>;
export type ApplyPersonsImportDto = z.infer<typeof applyPersonsImportSchema>;
export type PersonImportApplyOperationResultDto = z.infer<typeof personImportApplyOperationResultSchema>;
export type ApplyPersonsImportResultDto = z.infer<typeof applyPersonsImportResultSchema>;
