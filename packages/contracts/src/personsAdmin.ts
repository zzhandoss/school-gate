import { z } from "zod";

export const personAdminSchema = z.object({
    id: z.string().min(1),
    iin: z.string().min(1),
    terminalPersonId: z.string().min(1).nullable(),
    hasDeviceIdentities: z.boolean().optional(),
    firstName: z.string().min(1).nullable(),
    lastName: z.string().min(1).nullable(),
    createdAt: z.string().min(1)
});

export const listPersonsQuerySchema = z.object({
    iin: z.string().regex(/^\d{0,12}$/).optional(),
    query: z.string().trim().min(1).max(128).optional(),
    linkedStatus: z.enum(["all", "linked", "unlinked"]).optional(),
    deviceId: z.string().trim().min(1).max(128).optional(),
    includeDeviceIds: z.string().trim().min(1).max(2048).optional(),
    excludeDeviceIds: z.string().trim().min(1).max(2048).optional(),
    limit: z.coerce.number().int().positive().max(200).default(50),
    offset: z.coerce.number().int().nonnegative().default(0)
});

export const searchPersonsByIinResultSchema = z.object({
    persons: z.array(personAdminSchema)
});

export const listPersonsResultSchema = z.object({
    persons: z.array(personAdminSchema),
    page: z.object({
        limit: z.number().int().positive(),
        offset: z.number().int().nonnegative(),
        total: z.number().int().nonnegative()
    })
});

export const getPersonResultSchema = z.object({
    person: personAdminSchema
});

export const createPersonSchema = z.object({
    iin: z.string().regex(/^\d{12}$/),
    firstName: z.string().trim().min(1).max(128).nullable().optional(),
    lastName: z.string().trim().min(1).max(128).nullable().optional()
});

export const updatePersonSchema = z.object({
    iin: z.string().regex(/^\d{12}$/).optional(),
    firstName: z.string().trim().min(1).max(128).nullable().optional(),
    lastName: z.string().trim().min(1).max(128).nullable().optional()
});

export const deletePersonResultSchema = z.object({
    personId: z.string().min(1),
    deleted: z.literal(true),
    detachedIdentities: z.number().int().nonnegative(),
    deactivatedSubscriptions: z.number().int().nonnegative(),
    unlinkedRequests: z.number().int().nonnegative(),
    resetRequestsToNeedsPerson: z.number().int().nonnegative()
});

export const bulkDeletePersonsSchema = z.object({
    personIds: z.array(z.string().min(1)).min(1).max(200)
});

export const bulkDeletePersonsResultSchema = z.object({
    total: z.number().int().nonnegative(),
    deleted: z.number().int().nonnegative(),
    notFound: z.number().int().nonnegative(),
    errors: z.number().int().nonnegative(),
    results: z.array(
        z.object({
            personId: z.string().min(1),
            status: z.enum(["deleted", "not_found", "error"]),
            detachedIdentities: z.number().int().nonnegative().optional(),
            deactivatedSubscriptions: z.number().int().nonnegative().optional(),
            unlinkedRequests: z.number().int().nonnegative().optional(),
            resetRequestsToNeedsPerson: z.number().int().nonnegative().optional(),
            message: z.string().min(1).nullable().optional()
        })
    )
});

export const personIdentityAdminSchema = z.object({
    id: z.string().min(1),
    personId: z.string().min(1),
    deviceId: z.string().min(1),
    terminalPersonId: z.string().min(1),
    createdAt: z.string().min(1)
});

export const listPersonIdentitiesResultSchema = z.object({
    identities: z.array(personIdentityAdminSchema)
});

export const createPersonIdentitySchema = z.object({
    deviceId: z.string().min(1),
    terminalPersonId: z.string().min(1)
});

export const updatePersonIdentitySchema = z.object({
    deviceId: z.string().min(1),
    terminalPersonId: z.string().min(1)
});

export const previewPersonAutoIdentitiesByIinSchema = z.object({
    iin: z.string().regex(/^\d{12}$/)
});

export const personAutoIdentityMatchSchema = z.object({
    deviceId: z.string().min(1),
    adapterKey: z.string().min(1),
    terminalPersonId: z.string().min(1),
    firstName: z.string().min(1).nullable().optional(),
    lastName: z.string().min(1).nullable().optional(),
    score: z.number().nullable().optional(),
    rawPayload: z.string().min(1).nullable().optional(),
    displayName: z.string().min(1).nullable().optional(),
    source: z.string().min(1).nullable().optional(),
    userType: z.string().min(1).nullable().optional(),
    alreadyLinked: z.boolean()
});

export const personAutoIdentityDiagnosticsSchema = z.object({
    adaptersScanned: z.number().int().nonnegative(),
    devicesScanned: z.number().int().nonnegative(),
    devicesEligible: z.number().int().nonnegative(),
    requestsSent: z.number().int().nonnegative(),
    errors: z.number().int().nonnegative()
});

export const personAutoIdentityErrorSchema = z.object({
    adapterKey: z.string().min(1),
    deviceId: z.string().min(1),
    message: z.string().min(1)
});

export const previewPersonAutoIdentitiesResultSchema = z.object({
    personId: z.string().min(1),
    identityKey: z.string().min(1),
    identityValue: z.string().min(1),
    matches: z.array(personAutoIdentityMatchSchema),
    diagnostics: personAutoIdentityDiagnosticsSchema,
    errors: z.array(personAutoIdentityErrorSchema)
});

export const previewPersonAutoIdentitiesByIinResultSchema = z.object({
    iin: z.string().regex(/^\d{12}$/),
    identityKey: z.string().min(1),
    identityValue: z.string().min(1),
    matches: z.array(personAutoIdentityMatchSchema),
    diagnostics: personAutoIdentityDiagnosticsSchema,
    errors: z.array(personAutoIdentityErrorSchema)
});

export const applyPersonAutoIdentitiesSchema = z.object({
    identities: z
        .array(
            z.object({
                deviceId: z.string().min(1),
                terminalPersonId: z.string().min(1)
            })
        )
        .min(1)
});

export const applyPersonAutoIdentitiesResultSchema = z.object({
    personId: z.string().min(1),
    total: z.number().int().nonnegative(),
    linked: z.number().int().nonnegative(),
    alreadyLinked: z.number().int().nonnegative(),
    conflicts: z.number().int().nonnegative(),
    errors: z.number().int().nonnegative(),
    results: z.array(
        z.object({
            deviceId: z.string().min(1),
            terminalPersonId: z.string().min(1),
            status: z.enum(["linked", "already_linked", "conflict", "error"]),
            message: z.string().min(1).nullable().optional()
        })
    )
});

export type PersonAdminDto = z.infer<typeof personAdminSchema>;
export type SearchPersonsByIinResultDto = z.infer<typeof searchPersonsByIinResultSchema>;
export type ListPersonsQueryDto = z.infer<typeof listPersonsQuerySchema>;
export type ListPersonsResultDto = z.infer<typeof listPersonsResultSchema>;
export type GetPersonResultDto = z.infer<typeof getPersonResultSchema>;
export type CreatePersonDto = z.infer<typeof createPersonSchema>;
export type UpdatePersonDto = z.infer<typeof updatePersonSchema>;
export type DeletePersonResultDto = z.infer<typeof deletePersonResultSchema>;
export type BulkDeletePersonsDto = z.infer<typeof bulkDeletePersonsSchema>;
export type BulkDeletePersonsResultDto = z.infer<typeof bulkDeletePersonsResultSchema>;
export type PersonIdentityAdminDto = z.infer<typeof personIdentityAdminSchema>;
export type ListPersonIdentitiesResultDto = z.infer<typeof listPersonIdentitiesResultSchema>;
export type CreatePersonIdentityDto = z.infer<typeof createPersonIdentitySchema>;
export type UpdatePersonIdentityDto = z.infer<typeof updatePersonIdentitySchema>;
export type PreviewPersonAutoIdentitiesByIinDto = z.infer<typeof previewPersonAutoIdentitiesByIinSchema>;
export type PreviewPersonAutoIdentitiesResultDto = z.infer<typeof previewPersonAutoIdentitiesResultSchema>;
export type PreviewPersonAutoIdentitiesByIinResultDto = z.infer<typeof previewPersonAutoIdentitiesByIinResultSchema>;
export type ApplyPersonAutoIdentitiesDto = z.infer<typeof applyPersonAutoIdentitiesSchema>;
export type ApplyPersonAutoIdentitiesResultDto = z.infer<typeof applyPersonAutoIdentitiesResultSchema>;
