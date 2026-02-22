import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import {
    applyPersonAutoIdentitiesResultSchema,
    applyPersonAutoIdentitiesSchema,
    createPersonIdentitySchema,
    createPersonSchema,
    getPersonResultSchema,
    listPersonIdentitiesResultSchema,
    listPersonsQuerySchema,
    listPersonsResultSchema,
    previewPersonAutoIdentitiesResultSchema,
    previewPersonAutoIdentitiesByIinSchema,
    previewPersonAutoIdentitiesByIinResultSchema,
    searchPersonsByIinResultSchema,
    updatePersonIdentitySchema,
    updatePersonSchema,
    type CreatePersonDto,
    type UpdatePersonDto,
    type CreatePersonIdentityDto,
    type UpdatePersonIdentityDto,
    type ApplyPersonAutoIdentitiesDto,
    type ApplyPersonAutoIdentitiesResultDto,
    type GetPersonResultDto,
    type ListPersonsResultDto,
    type SearchPersonsByIinResultDto,
    type PreviewPersonAutoIdentitiesResultDto,
    type PreviewPersonAutoIdentitiesByIinDto,
    type PreviewPersonAutoIdentitiesByIinResultDto,
    type ListPersonIdentitiesResultDto,
} from "@school-gate/contracts";
import type { ApiEnv } from "../context.js";
import type { AdminAuth } from "../middleware/adminAuth.js";
import { parseBody } from "../middleware/parseJson.js";
import { parseQuery } from "../middleware/parseQuery.js";
import { useResponse } from "../middleware/response.js";
import { handler } from "../routing/route.js";
import { defineRoute, okSchema } from "../openapi/defineRoute.js";

const personParamsSchema = z.object({
    personId: z.string().min(1),
});

const identityParamsSchema = z.object({
    personId: z.string().min(1),
    identityId: z.string().min(1),
});

export type PersonsModule = {
    searchByIin: (input: { iin: string; limit: number }) => Promise<SearchPersonsByIinResultDto>;
    list?: (input: z.infer<typeof listPersonsQuerySchema>) => Promise<ListPersonsResultDto>;
    getById?: (input: { personId: string }) => Promise<GetPersonResultDto>;
    create?: (input: CreatePersonDto) => Promise<GetPersonResultDto>;
    update?: (input: { personId: string; patch: UpdatePersonDto }) => Promise<GetPersonResultDto>;
    listIdentities?: (input: { personId: string }) => Promise<ListPersonIdentitiesResultDto>;
    createIdentity?: (input: { personId: string; body: CreatePersonIdentityDto }) => Promise<void>;
    updateIdentity?: (input: { personId: string; identityId: string; body: UpdatePersonIdentityDto }) => Promise<void>;
    deleteIdentity?: (input: { personId: string; identityId: string }) => Promise<void>;
    previewAutoIdentities?: (input: { personId: string; adminId?: string; authorizationHeader?: string }) => Promise<PreviewPersonAutoIdentitiesResultDto>;
    previewAutoIdentitiesByIin?: (input: { body: PreviewPersonAutoIdentitiesByIinDto; adminId?: string; authorizationHeader?: string }) => Promise<PreviewPersonAutoIdentitiesByIinResultDto>;
    applyAutoIdentities?: (input: { personId: string; adminId?: string; authorizationHeader?: string; body: ApplyPersonAutoIdentitiesDto }) => Promise<ApplyPersonAutoIdentitiesResultDto>;
};

export function createPersonsRoutes(input: { module: PersonsModule; auth: AdminAuth }) {
    const app = new OpenAPIHono<ApiEnv>();
    app.use("*", input.auth.verify);

    app.openapi(
        defineRoute({
            method: "get",
            path: "/",
            tags: ["Persons"],
            summary: "List persons",
            middleware: [
                input.auth.requirePermissions(["persons.read"]),
                parseQuery({
                    schema: listPersonsQuerySchema,
                    invalidCode: "validation_error",
                    invalidMessage: "Persons query is invalid"
                }),
                useResponse(listPersonsResultSchema)
            ],
            request: { query: listPersonsQuerySchema },
            success: { schema: listPersonsResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<unknown, z.infer<typeof listPersonsQuerySchema>>(async ({ query }) => {
            if (input.module.list) {
                return input.module.list(query);
            }
            if (!query.iin) {
                return {
                    persons: [],
                    page: {
                        limit: query.limit,
                        offset: query.offset,
                        total: 0
                    }
                };
            }
            const data = await input.module.searchByIin({
                iin: query.iin,
                limit: query.limit + query.offset
            });
            const pagePersons = data.persons.slice(query.offset, query.offset + query.limit);
            return {
                persons: pagePersons,
                page: {
                    limit: query.limit,
                    offset: query.offset,
                    total: data.persons.length
                }
            };
        })
    );

    if (input.module.getById) {
        app.openapi(
            defineRoute({
                method: "get",
                path: "/:personId",
                tags: ["Persons"],
                summary: "Get person by id",
                middleware: [input.auth.requirePermissions(["persons.read"]), useResponse(getPersonResultSchema)],
                request: { params: personParamsSchema },
                success: { schema: getPersonResultSchema },
                security: [{ adminBearerAuth: [] }]
            }),
            handler<unknown, unknown, z.infer<typeof personParamsSchema>>(({ params }) =>
                input.module.getById!({ personId: params.personId })
            )
        );
    }

    if (input.module.create) {
        app.openapi(
            defineRoute({
                method: "post",
                path: "/",
                tags: ["Persons"],
                summary: "Create person",
                middleware: [
                    input.auth.requirePermissions(["persons.write"]),
                    parseBody(createPersonSchema),
                    useResponse(getPersonResultSchema)
                ],
                request: { body: createPersonSchema },
                success: { schema: getPersonResultSchema },
                security: [{ adminBearerAuth: [] }]
            }),
            handler<CreatePersonDto>(async ({ body }) => input.module.create!(body as CreatePersonDto))
        );
    }

    if (input.module.update) {
        app.openapi(
            defineRoute({
                method: "patch",
                path: "/:personId",
                tags: ["Persons"],
                summary: "Update person",
                middleware: [
                    input.auth.requirePermissions(["persons.write"]),
                    parseBody(updatePersonSchema),
                    useResponse(getPersonResultSchema)
                ],
                request: { params: personParamsSchema, body: updatePersonSchema },
                success: { schema: getPersonResultSchema },
                security: [{ adminBearerAuth: [] }]
            }),
            handler<UpdatePersonDto, unknown, z.infer<typeof personParamsSchema>>(async ({ body, params }) =>
                input.module.update!({ personId: params.personId, patch: body as UpdatePersonDto })
            )
        );
    }

    if (input.module.listIdentities) {
        app.openapi(
            defineRoute({
                method: "get",
                path: "/:personId/identities",
                tags: ["Persons"],
                summary: "List person identities",
                middleware: [input.auth.requirePermissions(["persons.read"]), useResponse(listPersonIdentitiesResultSchema)],
                request: { params: personParamsSchema },
                success: { schema: listPersonIdentitiesResultSchema },
                security: [{ adminBearerAuth: [] }]
            }),
            handler<unknown, unknown, z.infer<typeof personParamsSchema>>(({ params }) =>
                input.module.listIdentities!({ personId: params.personId })
            )
        );
    }

    if (input.module.createIdentity) {
        app.openapi(
            defineRoute({
                method: "post",
                path: "/:personId/identities",
                tags: ["Persons"],
                summary: "Create person identity",
                middleware: [
                    input.auth.requirePermissions(["persons.write"]),
                    parseBody(createPersonIdentitySchema),
                    useResponse(okSchema)
                ],
                request: { params: personParamsSchema, body: createPersonIdentitySchema },
                success: { schema: okSchema },
                security: [{ adminBearerAuth: [] }]
            }),
            handler<CreatePersonIdentityDto, unknown, z.infer<typeof personParamsSchema>>(async ({ body, params }) => {
                await input.module.createIdentity!({ personId: params.personId, body: body as CreatePersonIdentityDto });
                return { ok: true };
            })
        );
    }

    if (input.module.updateIdentity) {
        app.openapi(
            defineRoute({
                method: "patch",
                path: "/:personId/identities/:identityId",
                tags: ["Persons"],
                summary: "Update person identity",
                middleware: [
                    input.auth.requirePermissions(["persons.write"]),
                    parseBody(updatePersonIdentitySchema),
                    useResponse(okSchema)
                ],
                request: { params: identityParamsSchema, body: updatePersonIdentitySchema },
                success: { schema: okSchema },
                security: [{ adminBearerAuth: [] }]
            }),
            handler<UpdatePersonIdentityDto, unknown, z.infer<typeof identityParamsSchema>>(async ({ body, params }) => {
                await input.module.updateIdentity!({
                    personId: params.personId,
                    identityId: params.identityId,
                    body: body as UpdatePersonIdentityDto
                });
                return { ok: true };
            })
        );
    }

    if (input.module.deleteIdentity) {
        app.openapi(
            defineRoute({
                method: "delete",
                path: "/:personId/identities/:identityId",
                tags: ["Persons"],
                summary: "Delete person identity",
                middleware: [
                    input.auth.requirePermissions(["persons.write"]),
                    useResponse(okSchema)
                ],
                request: { params: identityParamsSchema },
                success: { schema: okSchema },
                security: [{ adminBearerAuth: [] }]
            }),
            handler<unknown, unknown, z.infer<typeof identityParamsSchema>>(async ({ params }) => {
                await input.module.deleteIdentity!({ personId: params.personId, identityId: params.identityId });
                return { ok: true };
            })
        );
    }

    if (input.module.previewAutoIdentities) {
        app.openapi(
            defineRoute({
                method: "post",
                path: "/:personId/identities/auto/preview",
                tags: ["Persons"],
                summary: "Preview auto identity mappings for person",
                middleware: [input.auth.requirePermissions(["persons.write"]), useResponse(previewPersonAutoIdentitiesResultSchema)],
                request: { params: personParamsSchema },
                success: { schema: previewPersonAutoIdentitiesResultSchema },
                security: [{ adminBearerAuth: [] }]
            }),
            handler<unknown, unknown, z.infer<typeof personParamsSchema>>(({ c, params }) => {
                const adminId = c.get("admin")?.adminId;
                const authorizationHeader = c.req.header("authorization");
                return input.module.previewAutoIdentities!({
                    personId: params.personId,
                    ...(adminId ? { adminId } : {}),
                    ...(authorizationHeader ? { authorizationHeader } : {}),
                });
            })
        );
    }

    if (input.module.previewAutoIdentitiesByIin) {
        app.openapi(
            defineRoute({
                method: "post",
                path: "/identities/auto/preview/by-iin",
                tags: ["Persons"],
                summary: "Preview auto identity mappings by IIN",
                middleware: [input.auth.requirePermissions(["persons.write"]), parseBody(previewPersonAutoIdentitiesByIinSchema), useResponse(previewPersonAutoIdentitiesByIinResultSchema)],
                request: { body: previewPersonAutoIdentitiesByIinSchema },
                success: { schema: previewPersonAutoIdentitiesByIinResultSchema },
                security: [{ adminBearerAuth: [] }]
            }),
            handler<PreviewPersonAutoIdentitiesByIinDto>(({ c, body }) => {
                const adminId = c.get("admin")?.adminId;
                const authorizationHeader = c.req.header("authorization");
                return input.module.previewAutoIdentitiesByIin!({
                    body: body as PreviewPersonAutoIdentitiesByIinDto,
                    ...(adminId ? { adminId } : {}),
                    ...(authorizationHeader ? { authorizationHeader } : {}),
                });
            })
        );
    }

    if (input.module.applyAutoIdentities) {
        app.openapi(
            defineRoute({
                method: "post",
                path: "/:personId/identities/auto/apply",
                tags: ["Persons"],
                summary: "Apply selected auto identity mappings for person",
                middleware: [input.auth.requirePermissions(["persons.write"]), parseBody(applyPersonAutoIdentitiesSchema), useResponse(applyPersonAutoIdentitiesResultSchema)],
                request: { params: personParamsSchema, body: applyPersonAutoIdentitiesSchema },
                success: { schema: applyPersonAutoIdentitiesResultSchema },
                security: [{ adminBearerAuth: [] }]
            }),
            handler<ApplyPersonAutoIdentitiesDto, unknown, z.infer<typeof personParamsSchema>>(({ c, params, body }) => {
                const adminId = c.get("admin")?.adminId;
                const authorizationHeader = c.req.header("authorization");
                return input.module.applyAutoIdentities!({
                    personId: params.personId,
                    body: body as ApplyPersonAutoIdentitiesDto,
                    ...(adminId ? { adminId } : {}),
                    ...(authorizationHeader ? { authorizationHeader } : {}),
                });
            })
        );
    }

    app.openapi(
        defineRoute({
            method: "get",
            path: "/search/by-iin",
            tags: ["Persons"],
            summary: "Search persons by IIN (legacy lookup)",
            middleware: [
                input.auth.requirePermissions(["persons.read"]),
                parseQuery({
                    schema: z.object({
                        iin: z.string().regex(/^\d{1,12}$/),
                        limit: z.coerce.number().int().positive().max(200).default(20)
                    }),
                    invalidCode: "validation_error",
                    invalidMessage: "Persons search query is invalid"
                }),
                useResponse(searchPersonsByIinResultSchema)
            ],
            request: {
                query: z.object({
                    iin: z.string().regex(/^\d{1,12}$/),
                    limit: z.coerce.number().int().positive().max(200).default(20)
                })
            },
            success: { schema: searchPersonsByIinResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<unknown, { iin: string; limit: number }>(({ query }) => input.module.searchByIin(query))
    );

    return app;
}
