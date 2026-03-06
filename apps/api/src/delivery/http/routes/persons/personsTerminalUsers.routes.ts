import {
    bulkCreatePersonTerminalUsersSchema,
    bulkPersonTerminalSyncResultSchema,
    createPersonTerminalUsersSchema,
    getPersonTerminalUserPhotoSchema,
    type BulkCreatePersonTerminalUsersDto,
    type CreatePersonTerminalUsersDto,
    type GetPersonTerminalUserPhotoDto,
    personTerminalSyncResultSchema,
    personTerminalUserPhotoResultSchema,
    type UpdatePersonTerminalUsersDto,
    updatePersonTerminalUsersSchema
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

export function registerPersonsTerminalUserRoutes(
    app: PersonsRoutesApp,
    input: PersonsRouteRegistrationInput
) {
    if (input.module.bulkCreateTerminalUsers) {
        app.openapi(
            defineRoute({
                method: "post",
                path: "/terminal-users/bulk-create",
                tags: ["Persons"],
                summary: "Create multiple persons on selected terminals",
                middleware: [
                    input.auth.requirePermissions(["persons.write"]),
                    parseBody(bulkCreatePersonTerminalUsersSchema),
                    useResponse(bulkPersonTerminalSyncResultSchema)
                ],
                request: { body: bulkCreatePersonTerminalUsersSchema },
                success: { schema: bulkPersonTerminalSyncResultSchema },
                security: [{ adminBearerAuth: [] }]
            }),
            handler<BulkCreatePersonTerminalUsersDto>(({ c, body }) => {
                const adminId = c.get("admin")?.adminId;
                const authorizationHeader = c.req.header("authorization");
                return input.module.bulkCreateTerminalUsers!({
                    body: body as BulkCreatePersonTerminalUsersDto,
                    ...(adminId ? { adminId } : {}),
                    ...(authorizationHeader ? { authorizationHeader } : {})
                });
            })
        );
    }

    if (input.module.createTerminalUsers) {
        app.openapi(
            defineRoute({
                method: "post",
                path: "/:personId/terminal-users/create",
                tags: ["Persons"],
                summary: "Create person on selected terminals",
                middleware: [
                    input.auth.requirePermissions(["persons.write"]),
                    parseBody(createPersonTerminalUsersSchema),
                    useResponse(personTerminalSyncResultSchema)
                ],
                request: { params: personParamsSchema, body: createPersonTerminalUsersSchema },
                success: { schema: personTerminalSyncResultSchema },
                security: [{ adminBearerAuth: [] }]
            }),
            handler<CreatePersonTerminalUsersDto, unknown, z.infer<typeof personParamsSchema>>(({ c, body, params }) => {
                const adminId = c.get("admin")?.adminId;
                const authorizationHeader = c.req.header("authorization");
                return input.module.createTerminalUsers!({
                    personId: params.personId,
                    body: body as CreatePersonTerminalUsersDto,
                    ...(adminId ? { adminId } : {}),
                    ...(authorizationHeader ? { authorizationHeader } : {})
                });
            })
        );
    }

    if (input.module.updateTerminalUsers) {
        app.openapi(
            defineRoute({
                method: "post",
                path: "/:personId/terminal-users/update",
                tags: ["Persons"],
                summary: "Update person on selected terminals",
                middleware: [
                    input.auth.requirePermissions(["persons.write"]),
                    parseBody(updatePersonTerminalUsersSchema),
                    useResponse(personTerminalSyncResultSchema)
                ],
                request: { params: personParamsSchema, body: updatePersonTerminalUsersSchema },
                success: { schema: personTerminalSyncResultSchema },
                security: [{ adminBearerAuth: [] }]
            }),
            handler<UpdatePersonTerminalUsersDto, unknown, z.infer<typeof personParamsSchema>>(({ c, body, params }) => {
                const adminId = c.get("admin")?.adminId;
                const authorizationHeader = c.req.header("authorization");
                return input.module.updateTerminalUsers!({
                    personId: params.personId,
                    body: body as UpdatePersonTerminalUsersDto,
                    ...(adminId ? { adminId } : {}),
                    ...(authorizationHeader ? { authorizationHeader } : {})
                });
            })
        );
    }

    if (input.module.getTerminalUserPhoto) {
        app.openapi(
            defineRoute({
                method: "post",
                path: "/:personId/terminal-users/photo/get",
                tags: ["Persons"],
                summary: "Read current terminal user photo",
                middleware: [
                    input.auth.requirePermissions(["persons.read"]),
                    parseBody(getPersonTerminalUserPhotoSchema),
                    useResponse(personTerminalUserPhotoResultSchema)
                ],
                request: { params: personParamsSchema, body: getPersonTerminalUserPhotoSchema },
                success: { schema: personTerminalUserPhotoResultSchema },
                security: [{ adminBearerAuth: [] }]
            }),
            handler<GetPersonTerminalUserPhotoDto, unknown, z.infer<typeof personParamsSchema>>(({ c, body, params }) => {
                const authorizationHeader = c.req.header("authorization");
                return input.module.getTerminalUserPhoto!({
                    personId: params.personId,
                    body: body as GetPersonTerminalUserPhotoDto,
                    ...(authorizationHeader ? { authorizationHeader } : {})
                });
            })
        );
    }
}
