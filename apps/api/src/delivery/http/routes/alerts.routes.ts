import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import {
    createAlertRuleResultSchema,
    createAlertRuleSchema,
    listAlertEventsQuerySchema,
    listAlertEventsResultSchema,
    listAlertRulesQuerySchema,
    listAlertRulesResultSchema,
    listAlertSubscriptionsQuerySchema,
    listAlertSubscriptionsResultSchema,
    setAlertSubscriptionSchema,
    updateAlertRuleSchema,
    type CreateAlertRuleDto,
    type ListAlertEventsQueryDto,
    type ListAlertEventsResultDto,
    type ListAlertRulesQueryDto,
    type ListAlertRulesResultDto,
    type ListAlertSubscriptionsQueryDto,
    type ListAlertSubscriptionsResultDto,
    type SetAlertSubscriptionDto,
    type UpdateAlertRuleDto
} from "@school-gate/contracts";
import type { ApiEnv } from "../context.js";
import type { AdminAuth } from "../middleware/adminAuth.js";
import { parseBody } from "../middleware/parseJson.js";
import { parseQuery } from "../middleware/parseQuery.js";
import { useResponse } from "../middleware/response.js";
import { handler } from "../routing/route.js";
import { defineRoute, okSchema } from "../openapi/defineRoute.js";

export type AlertsModule = {
    listRules: (input: ListAlertRulesQueryDto) => Promise<ListAlertRulesResultDto | ListAlertRulesResultDto["rules"]>;
    createRule: (input: CreateAlertRuleDto, adminId?: string | undefined) => Promise<{ ruleId: string }>;
    updateRule: (input: { ruleId: string } & UpdateAlertRuleDto, adminId?: string | undefined) => Promise<void>;
    listSubscriptions: (input: ListAlertSubscriptionsQueryDto) => Promise<ListAlertSubscriptionsResultDto | ListAlertSubscriptionsResultDto["subscriptions"]>;
    setSubscription: (input: SetAlertSubscriptionDto) => Promise<void>;
    listEvents: (input: ListAlertEventsQueryDto) => Promise<ListAlertEventsResultDto | ListAlertEventsResultDto["events"]>;
};

export function createAlertsRoutes(input: { module: AlertsModule; auth: AdminAuth }) {
    const app = new OpenAPIHono<ApiEnv>();
    const ruleIdParamsSchema = z.object({ ruleId: z.string() });

    app.use("*", input.auth.verify);

    app.openapi(
        defineRoute({
            method: "get",
            path: "/rules",
            tags: ["Alerts"],
            summary: "List alert rules",
            middleware: [
                input.auth.requirePermissions(["monitoring.read"]),
                parseQuery({
                    schema: listAlertRulesQuerySchema,
                    invalidCode: "invalid_query",
                    invalidMessage: "Alert rules query is invalid"
                }),
                useResponse(listAlertRulesResultSchema)
            ],
            request: { query: listAlertRulesQuerySchema },
            success: { schema: listAlertRulesResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<unknown, ListAlertRulesQueryDto>(async ({ query }) => {
            const result = await input.module.listRules(query);
            if (Array.isArray(result)) {
                return { rules: result };
            }
            return result;
        })
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/rules",
            tags: ["Alerts"],
            summary: "Create alert rule",
            middleware: [
                input.auth.requirePermissions(["admin.manage"]),
                parseBody(createAlertRuleSchema),
                useResponse(createAlertRuleResultSchema)
            ],
            request: { body: createAlertRuleSchema },
            success: { schema: createAlertRuleResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<CreateAlertRuleDto>(({ c, body }) =>
            input.module.createRule(body as CreateAlertRuleDto, c.get("admin")?.adminId)
        )
    );

    app.openapi(
        defineRoute({
            method: "patch",
            path: "/rules/:ruleId",
            tags: ["Alerts"],
            summary: "Update alert rule",
            middleware: [input.auth.requirePermissions(["admin.manage"]), parseBody(updateAlertRuleSchema)],
            request: {
                params: ruleIdParamsSchema,
                body: updateAlertRuleSchema
            },
            success: { schema: okSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<UpdateAlertRuleDto, unknown, { ruleId: string }>(async ({ c, body, params }) => {
            await input.module.updateRule(
                { ruleId: params.ruleId, ...(body as UpdateAlertRuleDto) },
                c.get("admin")?.adminId
            );
            return { ok: true };
        })
    );

    app.openapi(
        defineRoute({
            method: "get",
            path: "/subscriptions",
            tags: ["Alerts"],
            summary: "List alert subscriptions",
            middleware: [
                input.auth.requirePermissions(["monitoring.read"]),
                parseQuery({
                    schema: listAlertSubscriptionsQuerySchema,
                    invalidCode: "invalid_query",
                    invalidMessage: "Alert subscriptions query is invalid"
                }),
                useResponse(listAlertSubscriptionsResultSchema)
            ],
            request: { query: listAlertSubscriptionsQuerySchema },
            success: { schema: listAlertSubscriptionsResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<unknown, ListAlertSubscriptionsQueryDto>(async ({ query }) => {
            const result = await input.module.listSubscriptions(query);
            if (Array.isArray(result)) {
                return { subscriptions: result };
            }
            return result;
        })
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/subscriptions",
            tags: ["Alerts"],
            summary: "Set alert subscription",
            middleware: [input.auth.requirePermissions(["admin.manage"]), parseBody(setAlertSubscriptionSchema)],
            request: { body: setAlertSubscriptionSchema },
            success: { schema: okSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<SetAlertSubscriptionDto>(async ({ body }) => {
            await input.module.setSubscription(body as SetAlertSubscriptionDto);
            return { ok: true };
        })
    );

    app.openapi(
        defineRoute({
            method: "get",
            path: "/events",
            tags: ["Alerts"],
            summary: "List alert events",
            middleware: [
                input.auth.requirePermissions(["monitoring.read"]),
                parseQuery({
                    schema: listAlertEventsQuerySchema,
                    invalidCode: "invalid_query",
                    invalidMessage: "Alert events query is invalid"
                }),
                useResponse(listAlertEventsResultSchema)
            ],
            request: { query: listAlertEventsQuerySchema },
            success: { schema: listAlertEventsResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<unknown, ListAlertEventsQueryDto>(async ({ query }) => {
            const result = await input.module.listEvents(query);
            if (Array.isArray(result)) {
                return { events: result };
            }
            return result;
        })
    );

    return app;
}
