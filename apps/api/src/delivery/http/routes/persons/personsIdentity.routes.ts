import {
    applyPersonAutoIdentitiesResultSchema,
    applyPersonAutoIdentitiesSchema,
    createPersonIdentitySchema,
    listPersonIdentitiesResultSchema,
    previewPersonAutoIdentitiesByIinResultSchema,
    previewPersonAutoIdentitiesByIinSchema,
    previewPersonAutoIdentitiesResultSchema,
    type ApplyPersonAutoIdentitiesDto,
    type CreatePersonIdentityDto,
    type PreviewPersonAutoIdentitiesByIinDto,
    type UpdatePersonIdentityDto,
    updatePersonIdentitySchema
} from "@school-gate/contracts";
import type { z } from "zod";
import { parseBody } from "../../middleware/parseJson.js";
import { useResponse } from "../../middleware/response.js";
import { defineRoute, okSchema } from "../../openapi/defineRoute.js";
import { handler } from "../../routing/route.js";
import type {
    PersonsRouteRegistrationInput,
    PersonsRoutesApp
} from "./persons.types.js";
import {
    identityParamsSchema,
    personParamsSchema
} from "./persons.types.js";

export function registerPersonsIdentityRoutes(
    app: PersonsRoutesApp,
    input: PersonsRouteRegistrationInput
) {
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
                await input.module.createIdentity!({
                    personId: params.personId,
                    body: body as CreatePersonIdentityDto
                });
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
                await input.module.deleteIdentity!({
                    personId: params.personId,
                    identityId: params.identityId
                });
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
                    ...(authorizationHeader ? { authorizationHeader } : {})
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
                middleware: [
                    input.auth.requirePermissions(["persons.write"]),
                    parseBody(previewPersonAutoIdentitiesByIinSchema),
                    useResponse(previewPersonAutoIdentitiesByIinResultSchema)
                ],
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
                    ...(authorizationHeader ? { authorizationHeader } : {})
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
                middleware: [
                    input.auth.requirePermissions(["persons.write"]),
                    parseBody(applyPersonAutoIdentitiesSchema),
                    useResponse(applyPersonAutoIdentitiesResultSchema)
                ],
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
                    ...(authorizationHeader ? { authorizationHeader } : {})
                });
            })
        );
    }
}
