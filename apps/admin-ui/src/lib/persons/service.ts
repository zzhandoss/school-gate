import type {
    ApplyAutoIdentitiesInput,
    ApplyAutoIdentitiesResult,
    ApplyPersonsImportInput,
    ApplyPersonsImportResult,
    AutoIdentityPreviewByIinResult,
    AutoIdentityPreviewResult,
    BulkCreatePersonTerminalUsersInput,
    BulkDeletePersonsInput,
    BulkDeletePersonsResult,
    BulkPersonTerminalSyncResult,
    CreatePersonInput,
    CreatePersonsImportRunInput,
    DeletePersonResult,
    DeviceIdentityFindResult,
    GetPersonTerminalUserPhotoInput,
    GetPersonTerminalUserPhotoResult,
    ListPersonsImportCandidatesInput,
    ListPersonsImportCandidatesResult,
    ListPersonsInput,
    ListPersonsResult,
    PersonIdentityItem,
    PersonImportRun,
    PersonItem,
    PersonTerminalSyncInput,
    PersonTerminalSyncResult,
    UpdatePersonInput,
    UpsertPersonIdentityInput
} from "./types";
import { requestApi } from "@/lib/api/client";

type ListPersonsResponse = {
    persons: Array<PersonItem>
    page: {
        limit: number
        offset: number
        total: number
    }
};

type GetPersonResponse = {
    person: PersonItem
};

type ListPersonIdentitiesResponse = {
    identities: Array<PersonIdentityItem>
};

type CreatePersonsImportRunResponse = {
    run: PersonImportRun
};

export async function listPersons(input: ListPersonsInput = {}): Promise<ListPersonsResult> {
    const includeDeviceIds = Array.from(new Set((input.includeDeviceIds ?? []).map((value) => value.trim()).filter((value) => value.length > 0)));
    const excludeDeviceIds = Array.from(new Set((input.excludeDeviceIds ?? []).map((value) => value.trim()).filter((value) => value.length > 0)));
    const query = new URLSearchParams({
        limit: String(input.limit ?? 50),
        offset: String(input.offset ?? 0)
    });
    if (input.iin?.trim()) {
        query.set("iin", input.iin.trim());
    }
    if (input.query?.trim()) {
        query.set("query", input.query.trim());
    }
    if (input.linkedStatus && input.linkedStatus !== "all") {
        query.set("linkedStatus", input.linkedStatus);
    }
    if (includeDeviceIds.length > 0) {
        query.set("includeDeviceIds", includeDeviceIds.join(","));
    }
    if (excludeDeviceIds.length > 0) {
        query.set("excludeDeviceIds", excludeDeviceIds.join(","));
    }

    const response = await requestApi<ListPersonsResponse>(`/api/persons?${query.toString()}`);
    return response;
}

export async function getPerson(personId: string) {
    const response = await requestApi<GetPersonResponse>(`/api/persons/${personId}`);
    return response.person;
}

export async function createPerson(input: CreatePersonInput) {
    const response = await requestApi<GetPersonResponse>("/api/persons", {
        method: "POST",
        body: input
    });
    return response.person;
}

export async function updatePerson(personId: string, patch: UpdatePersonInput) {
    const response = await requestApi<GetPersonResponse>(`/api/persons/${personId}`, {
        method: "PATCH",
        body: patch
    });
    return response.person;
}

export async function deletePerson(personId: string) {
    return requestApi<DeletePersonResult>(`/api/persons/${personId}`, {
        method: "DELETE"
    });
}

export async function bulkDeletePersons(body: BulkDeletePersonsInput) {
    return requestApi<BulkDeletePersonsResult>("/api/persons/bulk-delete", {
        method: "POST",
        body
    });
}

export async function listPersonIdentities(personId: string) {
    const response = await requestApi<ListPersonIdentitiesResponse>(`/api/persons/${personId}/identities`);
    return response.identities;
}

export async function createPersonIdentity(personId: string, body: UpsertPersonIdentityInput) {
    await requestApi(`/api/persons/${personId}/identities`, {
        method: "POST",
        body
    });
}

export async function updatePersonIdentity(personId: string, identityId: string, body: UpsertPersonIdentityInput) {
    await requestApi(`/api/persons/${personId}/identities/${identityId}`, {
        method: "PATCH",
        body
    });
}

export async function deletePersonIdentity(personId: string, identityId: string) {
    await requestApi(`/api/persons/${personId}/identities/${identityId}`, {
        method: "DELETE"
    });
}

export async function previewAutoIdentities(personId: string) {
    return requestApi<AutoIdentityPreviewResult>(`/api/persons/${personId}/identities/auto/preview`, {
        method: "POST"
    });
}

export async function previewAutoIdentitiesByIin(iin: string) {
    return requestApi<AutoIdentityPreviewByIinResult>("/api/persons/identities/auto/preview/by-iin", {
        method: "POST",
        body: { iin }
    });
}

export async function findIdentityInDevice(input: { deviceId: string; identityKey: string; identityValue: string }) {
    return requestApi<DeviceIdentityFindResult>("/api/ds/identity/find", {
        method: "POST",
        body: {
            identityKey: input.identityKey,
            identityValue: input.identityValue,
            deviceId: input.deviceId,
            limit: 1
        }
    });
}

export async function applyAutoIdentities(personId: string, body: ApplyAutoIdentitiesInput) {
    return requestApi<ApplyAutoIdentitiesResult>(`/api/persons/${personId}/identities/auto/apply`, {
        method: "POST",
        body
    });
}

export async function createPersonsImportRun(input: CreatePersonsImportRunInput) {
    const response = await requestApi<CreatePersonsImportRunResponse>("/api/persons/import-runs", {
        method: "POST",
        body: {
            deviceIds: input.deviceIds,
            includeCards: input.includeCards ?? true,
            pageSize: input.pageSize ?? 100
        }
    });
    return response.run;
}

export async function listPersonsImportCandidates(
    input: ListPersonsImportCandidatesInput = {}
): Promise<ListPersonsImportCandidatesResult> {
    const query = new URLSearchParams({
        limit: String(input.limit ?? 100),
        offset: String(input.offset ?? 0),
        includeStale: String(input.includeStale ?? true)
    });

    if (input.status && input.status.length > 0) {
        query.set("status", input.status.join(","));
    }
    if (input.deviceId?.trim()) {
        query.set("deviceId", input.deviceId.trim());
    }
    if (input.iin?.trim()) {
        query.set("iin", input.iin.trim());
    }
    if (input.query?.trim()) {
        query.set("query", input.query.trim());
    }

    return requestApi<ListPersonsImportCandidatesResult>(`/api/persons/import-candidates?${query.toString()}`);
}

export async function applyPersonsImport(body: ApplyPersonsImportInput) {
    return requestApi<ApplyPersonsImportResult>("/api/persons/import/apply", {
        method: "POST",
        body
    });
}

export async function createPersonTerminalUsers(personId: string, body: PersonTerminalSyncInput) {
    return requestApi<PersonTerminalSyncResult>(`/api/persons/${personId}/terminal-users/create`, {
        method: "POST",
        body
    });
}

export async function bulkCreatePersonTerminalUsers(body: BulkCreatePersonTerminalUsersInput) {
    return requestApi<BulkPersonTerminalSyncResult>("/api/persons/terminal-users/bulk-create", {
        method: "POST",
        body
    });
}

export async function updatePersonTerminalUsers(personId: string, body: PersonTerminalSyncInput = {}) {
    return requestApi<PersonTerminalSyncResult>(`/api/persons/${personId}/terminal-users/update`, {
        method: "POST",
        body
    });
}

export async function getPersonTerminalUserPhoto(personId: string, body: GetPersonTerminalUserPhotoInput) {
    return requestApi<GetPersonTerminalUserPhotoResult>(`/api/persons/${personId}/terminal-users/photo/get`, {
        method: "POST",
        body
    });
}
