import {
    bulkDeletePersonsResultSchema,
    bulkDeletePersonsSchema,
    createPersonSchema,
    deletePersonResultSchema,
    getPersonResultSchema,
    type BulkDeletePersonsDto,
    type CreatePersonDto,
    type UpdatePersonDto,
    updatePersonSchema
} from "@school-gate/contracts";
import type { z } from "zod";
import { parseBody } from "../../middleware/parseJson.js";
import { useResponse } from "../../middleware/response.js";
import { defineRoute } from "../../openapi/defineRoute.js";
import { handler } from "../../routing/route.js";
import type {
    PersonsRouteRegistrationInput,
    PersonsRoutesApp
} from "./persons.types.js";
import { personParamsSchema } from "./persons.types.js";

export function registerPersonsCrudRoutes(
    app: PersonsRoutesApp,
    input: PersonsRouteRegistrationInput
) {
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

    if (input.module.deleteById) {
        app.openapi(
            defineRoute({
                method: "delete",
                path: "/:personId",
                tags: ["Persons"],
                summary: "Delete person",
                middleware: [input.auth.requirePermissions(["persons.write"]), useResponse(deletePersonResultSchema)],
                request: { params: personParamsSchema },
                success: { schema: deletePersonResultSchema },
                security: [{ adminBearerAuth: [] }]
            }),
            handler<unknown, unknown, z.infer<typeof personParamsSchema>>(({ c, params }) =>
                input.module.deleteById!({
                    personId: params.personId,
                    ...(c.get("admin")?.adminId ? { adminId: c.get("admin")!.adminId } : {})
                })
            )
        );
    }

    if (input.module.bulkDelete) {
        app.openapi(
            defineRoute({
                method: "post",
                path: "/bulk-delete",
                tags: ["Persons"],
                summary: "Bulk delete persons",
                middleware: [
                    input.auth.requirePermissions(["persons.write"]),
                    parseBody(bulkDeletePersonsSchema),
                    useResponse(bulkDeletePersonsResultSchema)
                ],
                request: { body: bulkDeletePersonsSchema },
                success: { schema: bulkDeletePersonsResultSchema },
                security: [{ adminBearerAuth: [] }]
            }),
            handler<BulkDeletePersonsDto>(({ c, body }) =>
                input.module.bulkDelete!({
                    body: body as BulkDeletePersonsDto,
                    ...(c.get("admin")?.adminId ? { adminId: c.get("admin")!.adminId } : {})
                })
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
            handler<CreatePersonDto>(({ body }) => input.module.create!(body as CreatePersonDto))
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
            handler<UpdatePersonDto, unknown, z.infer<typeof personParamsSchema>>(({ body, params }) =>
                input.module.update!({ personId: params.personId, patch: body as UpdatePersonDto })
            )
        );
    }
}
