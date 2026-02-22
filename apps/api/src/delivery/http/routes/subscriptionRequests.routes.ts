import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import {
    listPendingSubscriptionRequestsQuerySchema,
    listPendingSubscriptionRequestsResultSchema,
    resolveSubscriptionRequestPersonResultSchema,
    resolveSubscriptionRequestPersonSchema,
    reviewSubscriptionRequestResultSchema,
    reviewSubscriptionRequestSchema,
    type ListPendingSubscriptionRequestsQueryDto,
    type ListPendingSubscriptionRequestsResultDto,
    type ResolveSubscriptionRequestPersonDto,
    type ReviewSubscriptionRequestDto
} from "@school-gate/contracts";
import type { ApiEnv } from "../context.js";
import { HttpError } from "../errors/httpError.js";
import type { AdminAuth } from "../middleware/adminAuth.js";
import { parseBody } from "../middleware/parseJson.js";
import { parseQuery } from "../middleware/parseQuery.js";
import { useResponse } from "../middleware/response.js";
import { handler } from "../routing/route.js";
import { defineRoute } from "../openapi/defineRoute.js";

export type SubscriptionRequestsModule = {
    listPending: (input: ListPendingSubscriptionRequestsQueryDto) => Promise<ListPendingSubscriptionRequestsResultDto>;
    resolvePerson?: (input: {
        requestId: string;
        personId: string;
        adminId?: string;
    }) => Promise<{ requestId: string; resolutionStatus: "ready_for_review"; personId: string }>;
    review: (input: {
        requestId: string;
        adminTgUserId: string;
        decision: "approve" | "reject";
    }) => Promise<{ requestId: string; status: "approved" | "rejected"; personId: string | null }>;
};

export function createSubscriptionRequestsRoutes(input: { module: SubscriptionRequestsModule; auth: AdminAuth }) {
    const app = new OpenAPIHono<ApiEnv>();
    const requestIdParamsSchema = z.object({ requestId: z.string() });

    app.use("*", input.auth.verify);

    app.openapi(
        defineRoute({
            method: "get",
            path: "/",
            tags: ["Subscription Requests"],
            summary: "List pending subscription requests",
            middleware: [
                input.auth.requirePermissions(["subscriptions.read"]),
                parseQuery({
                    schema: listPendingSubscriptionRequestsQuerySchema,
                    defaults: { limit: "50" },
                    invalidCode: "invalid_query",
                    invalidMessage: "Subscription requests query is invalid"
                }),
                useResponse(listPendingSubscriptionRequestsResultSchema)
            ],
            request: { query: listPendingSubscriptionRequestsQuerySchema },
            success: { schema: listPendingSubscriptionRequestsResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<unknown, ListPendingSubscriptionRequestsQueryDto>(({ query }) => input.module.listPending(query))
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/:requestId/resolve-person",
            tags: ["Subscription Requests"],
            summary: "Resolve person for pending request",
            middleware: [
                input.auth.requirePermissions(["subscriptions.review"]),
                parseBody(resolveSubscriptionRequestPersonSchema),
                useResponse(resolveSubscriptionRequestPersonResultSchema)
            ],
            request: {
                params: requestIdParamsSchema,
                body: resolveSubscriptionRequestPersonSchema
            },
            success: { schema: resolveSubscriptionRequestPersonResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<ResolveSubscriptionRequestPersonDto, unknown, { requestId: string }>(({ c, body, params }) => {
            if (!input.module.resolvePerson) {
                throw new HttpError({
                    status: 501,
                    code: "subscription_request_resolve_not_supported",
                    message: "Subscription request resolve endpoint is not supported by current module"
                });
            }

            const adminId = c.get("admin")?.adminId;
            if (adminId) {
                return input.module.resolvePerson({
                    requestId: params.requestId,
                    personId: body!.personId,
                    adminId
                });
            }
            return input.module.resolvePerson({
                requestId: params.requestId,
                personId: body!.personId
            });
        })
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/:requestId/review",
            tags: ["Subscription Requests"],
            summary: "Review subscription request",
            middleware: [
                input.auth.requirePermissions(["subscriptions.review"]),
                parseBody(reviewSubscriptionRequestSchema),
                useResponse(reviewSubscriptionRequestResultSchema)
            ],
            request: {
                params: requestIdParamsSchema,
                body: reviewSubscriptionRequestSchema
            },
            success: { schema: reviewSubscriptionRequestResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<ReviewSubscriptionRequestDto, unknown, { requestId: string }>(({ body, params }) => {
            return input.module.review({
                requestId: params.requestId,
                adminTgUserId: body!.adminTgUserId,
                decision: body!.decision
            });
        })
    );

    return app;
}
