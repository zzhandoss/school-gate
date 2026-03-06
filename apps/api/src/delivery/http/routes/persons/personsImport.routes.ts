import {
    applyPersonsImportResultSchema,
    applyPersonsImportSchema,
    createPersonsImportRunResultSchema,
    createPersonsImportRunSchema,
    type ApplyPersonsImportDto,
    type CreatePersonsImportRunDto,
    listPersonsImportCandidatesQuerySchema,
    listPersonsImportCandidatesResultSchema
} from "@school-gate/contracts";
import type { z } from "zod";
import { parseBody } from "../../middleware/parseJson.js";
import { parseQuery } from "../../middleware/parseQuery.js";
import { useResponse } from "../../middleware/response.js";
import { defineRoute } from "../../openapi/defineRoute.js";
import { handler } from "../../routing/route.js";
import type {
    PersonsRouteRegistrationInput,
    PersonsRoutesApp
} from "./persons.types.js";

export function registerPersonsImportRoutes(
    app: PersonsRoutesApp,
    input: PersonsRouteRegistrationInput
) {
    if (input.module.createImportRun) {
        app.openapi(
            defineRoute({
                method: "post",
                path: "/import-runs",
                tags: ["Persons"],
                summary: "Sync terminal users from devices",
                middleware: [
                    input.auth.requirePermissions(["persons.write"]),
                    parseBody(createPersonsImportRunSchema),
                    useResponse(createPersonsImportRunResultSchema)
                ],
                request: { body: createPersonsImportRunSchema },
                success: { schema: createPersonsImportRunResultSchema },
                security: [{ adminBearerAuth: [] }]
            }),
            handler<CreatePersonsImportRunDto>(({ c, body }) => {
                const admin = c.get("admin");
                const adminId = admin?.adminId;
                const authorizationHeader = c.req.header("authorization");
                return input.module.createImportRun!({
                    body: body as CreatePersonsImportRunDto,
                    ...(adminId ? { adminId } : {}),
                    ...(admin ? { admin } : {}),
                    ...(authorizationHeader ? { authorizationHeader } : {})
                });
            })
        );
    }

    if (input.module.listImportCandidates) {
        app.openapi(
            defineRoute({
                method: "get",
                path: "/import-candidates",
                tags: ["Persons"],
                summary: "List terminal import candidates",
                middleware: [
                    input.auth.requirePermissions(["persons.read"]),
                    parseQuery({
                        schema: listPersonsImportCandidatesQuerySchema,
                        invalidCode: "validation_error",
                        invalidMessage: "Persons import query is invalid"
                    }),
                    useResponse(listPersonsImportCandidatesResultSchema)
                ],
                request: { query: listPersonsImportCandidatesQuerySchema },
                success: { schema: listPersonsImportCandidatesResultSchema },
                security: [{ adminBearerAuth: [] }]
            }),
            handler<unknown, z.infer<typeof listPersonsImportCandidatesQuerySchema>>(({ query }) =>
                input.module.listImportCandidates!(query)
            )
        );
    }

    if (input.module.applyImport) {
        app.openapi(
            defineRoute({
                method: "post",
                path: "/import/apply",
                tags: ["Persons"],
                summary: "Apply reviewed terminal import operations",
                middleware: [
                    input.auth.requirePermissions(["persons.write"]),
                    parseBody(applyPersonsImportSchema),
                    useResponse(applyPersonsImportResultSchema)
                ],
                request: { body: applyPersonsImportSchema },
                success: { schema: applyPersonsImportResultSchema },
                security: [{ adminBearerAuth: [] }]
            }),
            handler<ApplyPersonsImportDto>(({ c, body }) => {
                const adminId = c.get("admin")?.adminId;
                const authorizationHeader = c.req.header("authorization");
                return input.module.applyImport!({
                    body: body as ApplyPersonsImportDto,
                    ...(adminId ? { adminId } : {}),
                    ...(authorizationHeader ? { authorizationHeader } : {})
                });
            })
        );
    }
}
