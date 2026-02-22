import { OpenAPIHono } from "@hono/zod-openapi";
import {
    applyRetentionScheduleResultSchema,
    removeRetentionScheduleResultSchema,
    runRetentionOnceResultSchema,
    type ApplyRetentionScheduleResultDto,
    type RemoveRetentionScheduleResultDto,
    type RunRetentionOnceResultDto
} from "@school-gate/contracts";
import type { ApiEnv } from "../context.js";
import type { AdminAuth } from "../middleware/adminAuth.js";
import { useResponse } from "../middleware/response.js";
import { handler } from "../routing/route.js";
import { defineRoute } from "../openapi/defineRoute.js";

export type RetentionModule = {
    applySchedule: () => Promise<ApplyRetentionScheduleResultDto>;
    removeSchedule: () => Promise<RemoveRetentionScheduleResultDto>;
    runOnce: () => Promise<RunRetentionOnceResultDto>;
};

export function createRetentionRoutes(input: { module: RetentionModule; auth: AdminAuth }) {
    const app = new OpenAPIHono<ApiEnv>();

    app.use("*", input.auth.verify);

    app.openapi(
        defineRoute({
            method: "post",
            path: "/schedule/apply",
            tags: ["Retention"],
            summary: "Apply retention schedule",
            middleware: [input.auth.requirePermissions(["retention.manage"]), useResponse(applyRetentionScheduleResultSchema)],
            success: { schema: applyRetentionScheduleResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler(() => input.module.applySchedule())
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/schedule/remove",
            tags: ["Retention"],
            summary: "Remove retention schedule",
            middleware: [input.auth.requirePermissions(["retention.manage"]), useResponse(removeRetentionScheduleResultSchema)],
            success: { schema: removeRetentionScheduleResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler(() => input.module.removeSchedule())
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/run-once",
            tags: ["Retention"],
            summary: "Run retention once",
            middleware: [input.auth.requirePermissions(["retention.manage"]), useResponse(runRetentionOnceResultSchema)],
            success: { schema: runRetentionOnceResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler(() => input.module.runOnce())
    );

    return app;
}
