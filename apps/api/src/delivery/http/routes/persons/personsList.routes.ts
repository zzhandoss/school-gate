import {
    listPersonsQuerySchema,
    listPersonsResultSchema,
    searchPersonsByIinResultSchema
} from "@school-gate/contracts";
import type { z } from "zod";
import { parseQuery } from "../../middleware/parseQuery.js";
import { useResponse } from "../../middleware/response.js";
import { defineRoute } from "../../openapi/defineRoute.js";
import { handler } from "../../routing/route.js";
import type {
    PersonsRouteRegistrationInput,
    PersonsRoutesApp
} from "./persons.types.js";
import { searchPersonsByIinQuerySchema } from "./persons.types.js";

export function registerPersonsListRoutes(
    app: PersonsRoutesApp,
    input: PersonsRouteRegistrationInput
) {
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
        handler<unknown, z.infer<typeof listPersonsQuerySchema>>(({ query }) => input.module.list(query))
    );

    app.openapi(
        defineRoute({
            method: "get",
            path: "/search/by-iin",
            tags: ["Persons"],
            summary: "Search persons by IIN (legacy lookup)",
            middleware: [
                input.auth.requirePermissions(["persons.read"]),
                parseQuery({
                    schema: searchPersonsByIinQuerySchema,
                    invalidCode: "validation_error",
                    invalidMessage: "Persons search query is invalid"
                }),
                useResponse(searchPersonsByIinResultSchema)
            ],
            request: { query: searchPersonsByIinQuerySchema },
            success: { schema: searchPersonsByIinResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<unknown, { iin: string; limit: number }>(({ query }) => input.module.searchByIin(query))
    );
}
