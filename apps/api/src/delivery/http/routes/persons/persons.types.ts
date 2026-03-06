import type { OpenAPIHono } from "@hono/zod-openapi";
import type {
    listPersonsQuerySchema } from "@school-gate/contracts";
import {
    type ApplyPersonAutoIdentitiesDto,
    type ApplyPersonAutoIdentitiesResultDto,
    type ApplyPersonsImportDto,
    type ApplyPersonsImportResultDto,
    type BulkCreatePersonTerminalUsersDto,
    type BulkDeletePersonsDto,
    type BulkDeletePersonsResultDto,
    type BulkPersonTerminalSyncResultDto,
    type CreatePersonDto,
    type CreatePersonIdentityDto,
    type CreatePersonsImportRunDto,
    type CreatePersonsImportRunResultDto,
    type CreatePersonTerminalUsersDto,
    type DeletePersonResultDto,
    type GetPersonResultDto,
    type GetPersonTerminalUserPhotoDto,
    type ListPersonIdentitiesResultDto,
    type ListPersonsImportCandidatesQueryDto,
    type ListPersonsImportCandidatesResultDto,
    type ListPersonsResultDto,
    type PersonTerminalSyncResultDto,
    type PersonTerminalUserPhotoResultDto,
    type PreviewPersonAutoIdentitiesByIinDto,
    type PreviewPersonAutoIdentitiesByIinResultDto,
    type PreviewPersonAutoIdentitiesResultDto,
    type SearchPersonsByIinResultDto,
    type UpdatePersonDto,
    type UpdatePersonIdentityDto,
    type UpdatePersonTerminalUsersDto
} from "@school-gate/contracts";
import { z } from "zod";
import type { ApiEnv } from "../../context.js";
import type { AdminAuth, AdminContext } from "../../middleware/adminAuth.js";

export const personParamsSchema = z.object({
    personId: z.string().min(1)
});

export const identityParamsSchema = z.object({
    personId: z.string().min(1),
    identityId: z.string().min(1)
});

export const searchPersonsByIinQuerySchema = z.object({
    iin: z.string().regex(/^\d{1,12}$/),
    limit: z.coerce.number().int().positive().max(200).default(20)
});

export type PersonsRoutesApp = OpenAPIHono<ApiEnv>;

export type PersonsRouteRegistrationInput = {
    module: PersonsModule;
    auth: AdminAuth;
};

export type PersonsListModule = {
    searchByIin: (input: { iin: string; limit: number }) => Promise<SearchPersonsByIinResultDto | SearchPersonsByIinResultDto["persons"]>;
    list: (input: z.infer<typeof listPersonsQuerySchema>) => Promise<ListPersonsResultDto>;
};

export type PersonsCrudModule = {
    getById?: (input: { personId: string }) => Promise<GetPersonResultDto>;
    create?: (input: CreatePersonDto) => Promise<GetPersonResultDto>;
    update?: (input: { personId: string; patch: UpdatePersonDto }) => Promise<GetPersonResultDto>;
    deleteById?: (input: { personId: string; adminId?: string }) => Promise<DeletePersonResultDto>;
    bulkDelete?: (input: { body: BulkDeletePersonsDto; adminId?: string }) => Promise<BulkDeletePersonsResultDto>;
};

export type PersonsIdentityModule = {
    listIdentities?: (input: { personId: string }) => Promise<ListPersonIdentitiesResultDto>;
    createIdentity?: (input: { personId: string; body: CreatePersonIdentityDto }) => Promise<void>;
    updateIdentity?: (input: { personId: string; identityId: string; body: UpdatePersonIdentityDto }) => Promise<void>;
    deleteIdentity?: (input: { personId: string; identityId: string }) => Promise<void>;
    previewAutoIdentities?: (input: { personId: string; adminId?: string; authorizationHeader?: string }) => Promise<PreviewPersonAutoIdentitiesResultDto>;
    previewAutoIdentitiesByIin?: (input: { body: PreviewPersonAutoIdentitiesByIinDto; adminId?: string; authorizationHeader?: string }) => Promise<PreviewPersonAutoIdentitiesByIinResultDto>;
    applyAutoIdentities?: (input: { personId: string; adminId?: string; authorizationHeader?: string; body: ApplyPersonAutoIdentitiesDto }) => Promise<ApplyPersonAutoIdentitiesResultDto>;
};

export type PersonsImportModule = {
    createImportRun?: (input: { body: CreatePersonsImportRunDto; adminId?: string; admin?: AdminContext; authorizationHeader?: string }) => Promise<CreatePersonsImportRunResultDto>;
    listImportCandidates?: (input: ListPersonsImportCandidatesQueryDto) => Promise<ListPersonsImportCandidatesResultDto>;
    applyImport?: (input: { body: ApplyPersonsImportDto; adminId?: string; authorizationHeader?: string }) => Promise<ApplyPersonsImportResultDto>;
};

export type PersonsTerminalUsersModule = {
    bulkCreateTerminalUsers?: (input: { body: BulkCreatePersonTerminalUsersDto; adminId?: string; authorizationHeader?: string }) => Promise<BulkPersonTerminalSyncResultDto>;
    createTerminalUsers?: (input: { personId: string; body: CreatePersonTerminalUsersDto; adminId?: string; authorizationHeader?: string }) => Promise<PersonTerminalSyncResultDto>;
    updateTerminalUsers?: (input: { personId: string; body: UpdatePersonTerminalUsersDto; adminId?: string; authorizationHeader?: string }) => Promise<PersonTerminalSyncResultDto>;
    getTerminalUserPhoto?: (input: { personId: string; body: GetPersonTerminalUserPhotoDto; authorizationHeader?: string }) => Promise<PersonTerminalUserPhotoResultDto>;
};

export type PersonsModule =
    & PersonsListModule
    & PersonsCrudModule
    & PersonsIdentityModule
    & PersonsImportModule
    & PersonsTerminalUsersModule;
