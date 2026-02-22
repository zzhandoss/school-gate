import { OpenAPIHono } from "@hono/zod-openapi";
import {
    listMonitoringSnapshotsQuerySchema,
    listMonitoringSnapshotsResultSchema,
    monitoringSnapshotSchema,
    type ListMonitoringSnapshotsQueryDto,
    type ListMonitoringSnapshotsResultDto,
    type MonitoringSnapshotDto
} from "@school-gate/contracts";
import type { ApiEnv } from "../context.js";
import type { AdminAuth } from "../middleware/adminAuth.js";
import { parseQuery } from "../middleware/parseQuery.js";
import { useResponse } from "../middleware/response.js";
import { handler } from "../routing/route.js";
import { defineRoute } from "../openapi/defineRoute.js";

export type MonitoringModule = {
    getSnapshot: () => Promise<MonitoringSnapshotDto>;
    listSnapshots: (input: ListMonitoringSnapshotsQueryDto) => Promise<ListMonitoringSnapshotsResultDto>;
};

export function createMonitoringRoutes(input: { module: MonitoringModule; auth: AdminAuth }) {
    const app = new OpenAPIHono<ApiEnv>();

    app.use("*", input.auth.verify);

    app.openapi(
        defineRoute({
            method: "get",
            path: "/",
            tags: ["Monitoring"],
            summary: "Get monitoring snapshot",
            middleware: [input.auth.requirePermissions(["monitoring.read"]), useResponse(monitoringSnapshotSchema)],
            success: { schema: monitoringSnapshotSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler(() => input.module.getSnapshot())
    );

    app.openapi(
        defineRoute({
            method: "get",
            path: "/snapshots",
            tags: ["Monitoring"],
            summary: "List monitoring snapshots",
            middleware: [
                input.auth.requirePermissions(["monitoring.read"]),
                parseQuery({
                    schema: listMonitoringSnapshotsQuerySchema,
                    invalidCode: "invalid_query",
                    invalidMessage: "Monitoring snapshots query is invalid"
                }),
                useResponse(listMonitoringSnapshotsResultSchema)
            ],
            request: { query: listMonitoringSnapshotsQuerySchema },
            success: { schema: listMonitoringSnapshotsResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<unknown, ListMonitoringSnapshotsQueryDto>(({ query }) => input.module.listSnapshots(query))
    );

    return app;
}
