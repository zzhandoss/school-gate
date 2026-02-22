import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import {
    listSubscriptionsQuerySchema,
    listSubscriptionsResultSchema,
    subscriptionActionResultSchema,
    type ListSubscriptionsQueryDto,
    type ListSubscriptionsResultDto,
    type SubscriptionActionResultDto
} from "@school-gate/contracts";
import type { ApiEnv } from "../context.js";
import type { AdminAuth } from "../middleware/adminAuth.js";
import { parseQuery } from "../middleware/parseQuery.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { useResponse } from "../middleware/response.js";
import { handler } from "../routing/route.js";
import { defineRoute } from "../openapi/defineRoute.js";

export type SubscriptionsModule = {
    list: (input: ListSubscriptionsQueryDto) => Promise<ListSubscriptionsResultDto>;
    activate: (input: { subscriptionId: string; adminId: string }) => Promise<SubscriptionActionResultDto>;
    deactivate: (input: { subscriptionId: string; adminId: string }) => Promise<SubscriptionActionResultDto>;
};

export function createSubscriptionsRoutes(input: { module: SubscriptionsModule; auth: AdminAuth }) {
    const app = new OpenAPIHono<ApiEnv>();
    const subscriptionIdParamsSchema = z.object({ subscriptionId: z.string() });

    app.use("*", input.auth.verify);

    app.openapi(
        defineRoute({
            method: "get",
            path: "/",
            tags: ["Subscriptions"],
            summary: "List subscriptions",
            middleware: [
                input.auth.requirePermissions(["subscriptions.read"]),
                parseQuery({
                    schema: listSubscriptionsQuerySchema,
                    invalidCode: "invalid_query",
                    invalidMessage: "Subscriptions query is invalid"
                }),
                useResponse(listSubscriptionsResultSchema)
            ],
            request: { query: listSubscriptionsQuerySchema },
            success: { schema: listSubscriptionsResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<unknown, ListSubscriptionsQueryDto>(({ query }) => input.module.list(query))
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/:subscriptionId/activate",
            tags: ["Subscriptions"],
            summary: "Activate subscription",
            middleware: [
                requireAdmin(),
                input.auth.requirePermissions(["subscriptions.manage"]),
                useResponse(subscriptionActionResultSchema)
            ],
            request: { params: subscriptionIdParamsSchema },
            success: { schema: subscriptionActionResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<unknown, unknown, { subscriptionId: string }>(({ c, params }) => {
            return input.module.activate({ subscriptionId: params.subscriptionId, adminId: c.get("adminId") as string });
        })
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/:subscriptionId/deactivate",
            tags: ["Subscriptions"],
            summary: "Deactivate subscription",
            middleware: [
                requireAdmin(),
                input.auth.requirePermissions(["subscriptions.manage"]),
                useResponse(subscriptionActionResultSchema)
            ],
            request: { params: subscriptionIdParamsSchema },
            success: { schema: subscriptionActionResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<unknown, unknown, { subscriptionId: string }>(({ c, params }) => {
            return input.module.deactivate({ subscriptionId: params.subscriptionId, adminId: c.get("adminId") as string });
        })
    );

    return app;
}




