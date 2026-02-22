import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import {
    listAccessEventsQuerySchema,
    listAccessEventsResultSchema,
    listUnmatchedAccessEventsResultSchema,
    mapTerminalIdentityResultSchema,
    mapTerminalIdentitySchema,
    type ListAccessEventsQueryDto,
    type ListAccessEventsResultDto,
    type MapTerminalIdentityDto
} from "@school-gate/contracts";
import type { ListUnmatchedAccessEventsResultDto } from "@school-gate/contracts";
import type { ApiEnv } from "../context.js";
import { HttpError } from "../errors/httpError.js";
import type { AdminAuth } from "../middleware/adminAuth.js";
import { parseBody } from "../middleware/parseJson.js";
import { parseQuery } from "../middleware/parseQuery.js";
import { handler } from "../routing/route.js";
import { useResponse } from "../middleware/response.js";
import { defineRoute } from "../openapi/defineRoute.js";

const limitSchema = z.object({
    limit: z.coerce.number().int().positive().max(500).default(50)
});

export type AccessEventsAdminModule = {
    list?: (input: ListAccessEventsQueryDto) => Promise<ListAccessEventsResultDto>;
    listUnmatched: (input: { limit: number }) => Promise<ListUnmatchedAccessEventsResultDto | ListUnmatchedAccessEventsResultDto["events"]>;
    mapTerminalIdentity: (input: MapTerminalIdentityDto & { adminId?: string }) => Promise<{ status: "linked" | "already_linked"; updatedEvents: number }>;
};

export function createAccessEventsAdminRoutes(input: { module: AccessEventsAdminModule; auth: AdminAuth }) {
    const app = new OpenAPIHono<ApiEnv>();

    app.use("*", input.auth.verify);

    app.openapi(
        defineRoute({
            method: "get",
            path: "/",
            tags: ["Access Events Admin"],
            summary: "List access events with filters and pagination",
            middleware: [
                input.auth.requirePermissions(["access_events.read"]),
                parseQuery({
                    schema: listAccessEventsQuerySchema,
                    invalidCode: "invalid_access_events_query",
                    invalidMessage: "Access events query is invalid"
                }),
                useResponse(listAccessEventsResultSchema)
            ],
            request: { query: listAccessEventsQuerySchema },
            success: { schema: listAccessEventsResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<unknown, ListAccessEventsQueryDto>(async ({ query }) => {
            if (input.module.list) {
                return input.module.list(query);
            }

            throw new HttpError({
                status: 501,
                code: "access_events_list_not_supported",
                message: "Access events list endpoint is not supported by current module"
            });
        })
    );

    app.openapi(
        defineRoute({
            method: "get",
            path: "/unmatched",
            tags: ["Access Events Admin"],
            summary: "List unmatched access events",
            middleware: [
                input.auth.requirePermissions(["access_events.read"]),
                parseQuery({
                    schema: limitSchema,
                    invalidCode: "invalid_limit",
                    invalidMessage: "Limit query parameter is invalid"
                }),
                useResponse(listUnmatchedAccessEventsResultSchema)
            ],
            request: { query: limitSchema },
            success: { schema: listUnmatchedAccessEventsResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<unknown, z.infer<typeof limitSchema>>(async ({ query }) => {
            const result = await input.module.listUnmatched({ limit: query.limit });
            if (Array.isArray(result)) {
                return { events: result };
            }
            return result;
        })
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/mappings",
            tags: ["Access Events Admin"],
            summary: "Map terminal identity to person",
            middleware: [
                input.auth.requirePermissions(["access_events.map"]),
                parseBody(mapTerminalIdentitySchema),
                useResponse(mapTerminalIdentityResultSchema)
            ],
            request: { body: mapTerminalIdentitySchema },
            success: { schema: mapTerminalIdentityResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<MapTerminalIdentityDto>(({ c, body }) => {
            const adminId = c.get("admin")?.adminId;
            if (adminId) {
                return input.module.mapTerminalIdentity({
                    ...(body as MapTerminalIdentityDto),
                    adminId
                });
            }
            return input.module.mapTerminalIdentity(body as MapTerminalIdentityDto);
        })
    );

    return app;
}




