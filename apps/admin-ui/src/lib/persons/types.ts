export type PersonItem = {
    id: string
    iin: string
    terminalPersonId: string | null
    hasDeviceIdentities?: boolean
    firstName: string | null
    lastName: string | null
    createdAt: string
};

export type PersonIdentityItem = {
    id: string
    personId: string
    deviceId: string
    terminalPersonId: string
    createdAt: string
};

export type ListPersonsInput = {
    limit?: number
    offset?: number
    iin?: string
    query?: string
    linkedStatus?: "all" | "linked" | "unlinked"
    includeDeviceIds?: Array<string>
    excludeDeviceIds?: Array<string>
};

export type ListPersonsResult = {
    persons: Array<PersonItem>
    page: {
        limit: number
        offset: number
        total: number
    }
};

export type CreatePersonInput = {
    iin: string
    firstName?: string | null
    lastName?: string | null
};

export type CreatePersonWithAutoIdentitiesInput = CreatePersonInput & {
    autoIdentities?: Array<{
        deviceId: string
        terminalPersonId: string
    }>
};

export type UpdatePersonInput = {
    iin?: string
    firstName?: string | null
    lastName?: string | null
};

export type DeletePersonResult = {
    personId: string
    deleted: true
    detachedIdentities: number
    deactivatedSubscriptions: number
    unlinkedRequests: number
    resetRequestsToNeedsPerson: number
};

export type BulkDeletePersonsInput = {
    personIds: Array<string>
};

export type BulkDeletePersonsResult = {
    total: number
    deleted: number
    notFound: number
    errors: number
    results: Array<
        | ({
            personId: string
            status: "deleted"
        } & DeletePersonResult)
        | {
            personId: string
            status: "not_found" | "error"
            message?: string | null
        }
    >
};

export type UpsertPersonIdentityInput = {
    deviceId: string
    terminalPersonId: string
};

export type AutoIdentityPreviewMatch = {
    deviceId: string
    adapterKey: string
    terminalPersonId: string
    firstName?: string | null
    lastName?: string | null
    score?: number | null
    rawPayload?: string | null
    displayName?: string | null
    source?: string | null
    userType?: string | null
    alreadyLinked: boolean
};

export type DeviceIdentityFindMatch = Omit<AutoIdentityPreviewMatch, "alreadyLinked">;

export type DeviceIdentityFindResult = {
    identityKey: string
    identityValue: string
    matches: Array<DeviceIdentityFindMatch>
    diagnostics: {
        adaptersScanned: number
        devicesScanned: number
        devicesEligible: number
        requestsSent: number
        errors: number
    }
    errors: Array<{
        adapterKey: string
        deviceId: string
        message: string
    }>
};

export type AutoIdentityPreviewResult = {
    personId: string
    identityKey: string
    identityValue: string
    matches: Array<AutoIdentityPreviewMatch>
    diagnostics: {
        adaptersScanned: number
        devicesScanned: number
        devicesEligible: number
        requestsSent: number
        errors: number
    }
    errors: Array<{
        adapterKey: string
        deviceId: string
        message: string
    }>
};

export type AutoIdentityPreviewByIinResult = {
    iin: string
    identityKey: string
    identityValue: string
    matches: Array<AutoIdentityPreviewMatch>
    diagnostics: {
        adaptersScanned: number
        devicesScanned: number
        devicesEligible: number
        requestsSent: number
        errors: number
    }
    errors: Array<{
        adapterKey: string
        deviceId: string
        message: string
    }>
};

export type ApplyAutoIdentitiesInput = {
    identities: Array<{
        deviceId: string
        terminalPersonId: string
    }>
};

export type ApplyAutoIdentitiesResult = {
    personId: string
    total: number
    linked: number
    alreadyLinked: number
    conflicts: number
    errors: number
    results: Array<{
        deviceId: string
        terminalPersonId: string
        status: "linked" | "already_linked" | "conflict" | "error"
        message?: string | null
    }>
};

export type PersonImportCandidateStatus =
    | "ready_create"
    | "ready_link"
    | "already_linked"
    | "conflict"
    | "missing_iin"
    | "stale_terminal_record";

export type PersonImportRunSummary = {
    deviceCount: number
    processedDeviceCount: number
    entryCount: number
    errorCount: number
    errors: Array<{
        deviceId: string
        errorCode: string | null
        errorMessage: string | null
    }>
};

export type PersonImportRun = {
    id: string
    status: "running" | "completed" | "failed" | "partial"
    requestedByAdminId: string | null
    includeCards: boolean
    pageSize: number
    deviceIds: Array<string>
    startedAt: string
    finishedAt: string | null
    summary: PersonImportRunSummary
};

export type CreatePersonsImportRunInput = {
    deviceIds: Array<string>
    includeCards?: boolean
    pageSize?: number
};

export type PersonImportCandidateEntry = {
    directoryEntryId: string
    deviceId: string
    terminalPersonId: string
    iin: string | null
    displayName: string | null
    userType: string | null
    userStatus: string | null
    authority: string | null
    validFrom: string | null
    validTo: string | null
    cardNo: string | null
    cardName: string | null
    sourceSummary: Array<string>
    linkedPersonId: string | null
    linkedPersonName: string | null
    linkedPersonIin: string | null
    isPresentInLastSync: boolean
    lastSeenAt: string
    stateReason: string
};

export type PersonImportCandidateGroup = {
    groupKey: string
    status: PersonImportCandidateStatus
    iin: string | null
    displayName: string | null
    suggestedPersonId: string | null
    suggestedPersonName: string | null
    suggestedPersonIin: string | null
    warnings: Array<string>
    entries: Array<PersonImportCandidateEntry>
};

export type ListPersonsImportCandidatesInput = {
    status?: Array<PersonImportCandidateStatus>
    deviceId?: string
    iin?: string
    query?: string
    includeStale?: boolean
    limit?: number
    offset?: number
};

export type ListPersonsImportCandidatesResult = {
    groups: Array<PersonImportCandidateGroup>
    page: {
        limit: number
        offset: number
        total: number
    }
    summary: Record<PersonImportCandidateStatus, number>
};

export type PersonImportApplyOperation = {
    type: "create_person_and_link" | "link_existing" | "reassign_identity" | "skip"
    directoryEntryIds: Array<string>
    targetPersonId?: string
    expectedCurrentPersonId?: string | null
    personDraft?: {
        iin: string
        firstName?: string | null
        lastName?: string | null
    }
};

export type ApplyPersonsImportInput = {
    operations: Array<PersonImportApplyOperation>
};

export type ApplyPersonsImportResult = {
    total: number
    applied: number
    skipped: number
    conflicts: number
    errors: number
    results: Array<{
        type: PersonImportApplyOperation["type"]
        directoryEntryIds: Array<string>
        status: "applied" | "skipped" | "conflict" | "error"
        personId?: string | null
        message?: string | null
    }>
};

export type PersonTerminalSyncInput = {
    deviceIds?: Array<string>
    terminalPersonId?: string
    displayName?: string | null
    userType?: number | null
    userStatus?: number | null
    authority?: number | null
    citizenIdNo?: string | null
    validFrom?: string | null
    validTo?: string | null
    card?: {
        cardNo: string
        cardName?: string | null
        cardType?: number | null
        cardStatus?: number | null
    }
    face?: {
        photosBase64?: Array<string> | null
        photoUrls?: Array<string> | null
    }
};

export type BulkCreatePersonTerminalUsersInput = {
    personIds: Array<string>
    deviceIds: Array<string>
    validFrom?: string | null
    validTo?: string | null
};

export type PersonTerminalSyncResult = {
    personId: string
    total: number
    success: number
    failed: number
    results: Array<{
        deviceId: string
        operation: "create" | "update"
        status: "success" | "failed" | "skipped"
        steps: {
            accessUser: "success" | "failed" | "skipped"
            accessCard: "success" | "failed" | "skipped"
            accessFace: "success" | "failed" | "skipped"
        }
        errorCode?: string | null
        errorMessage?: string | null
        skipCode?: string | null
        skipMessage?: string | null
    }>
};

export type BulkPersonTerminalSyncResult = {
    totalPersons: number
    total: number
    success: number
    failed: number
    results: Array<{
        personId: string
        userId: string
        total: number
        success: number
        failed: number
        results: PersonTerminalSyncResult["results"]
    }>
};

export type PersonTerminalPhoto = {
    deviceId: string
    userId: string
    photoData?: Array<string> | null
    photoUrl?: Array<string> | null
    faceData?: Array<string> | null
};

export type GetPersonTerminalUserPhotoInput = {
    deviceId: string
    userId?: string
};

export type GetPersonTerminalUserPhotoResult = {
    personId: string
    photo: PersonTerminalPhoto
};
