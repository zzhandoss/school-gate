import { OpenAPIHono } from "@hono/zod-openapi";
import {
    listAuditLogsQuerySchema,
    listAuditLogsResultSchema,
    type ListAuditLogsQueryDto,
    type ListAuditLogsResultDto
} from "@school-gate/contracts";
import type { ApiEnv } from "../context.js";
import type { AdminAuth } from "../middleware/adminAuth.js";
import { parseQuery } from "../middleware/parseQuery.js";
import { useResponse } from "../middleware/response.js";
import { handler } from "../routing/route.js";
import { defineRoute } from "../openapi/defineRoute.js";

export type AuditLogsModule = {
    list: (input: ListAuditLogsQueryDto) => Promise<ListAuditLogsResultDto>;
};

export function createAuditLogsRoutes(input: { module: AuditLogsModule; auth: AdminAuth }) {
    const app = new OpenAPIHono<ApiEnv>();

    app.use("*", input.auth.verify);

    app.openapi(
        defineRoute({
            method: "get",
            path: "/",
            tags: ["Audit Logs"],
            summary: "List audit logs",
            middleware: [
                input.auth.requirePermissions(["monitoring.read"]),
                parseQuery({
                    schema: listAuditLogsQuerySchema,
                    invalidCode: "invalid_query",
                    invalidMessage: "Audit logs query is invalid"
                }),
                useResponse(listAuditLogsResultSchema)
            ],
            request: { query: listAuditLogsQuerySchema },
            success: { schema: listAuditLogsResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<unknown, ListAuditLogsQueryDto>(({ query }) => input.module.list(query))
    );

    return app;
}
