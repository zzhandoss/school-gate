import { OpenAPIHono } from "@hono/zod-openapi";
import type { MiddlewareHandler } from "hono";
import { z } from "zod";
import {
    accessEventIngestBatchResultSchema,
    accessEventIngestBatchSchema,
    accessEventIngestResultSchema,
    accessEventIngestSchema,
    type AccessEventIngestBatchInput,
    type AccessEventIngestInput,
    type AccessEventIngestResult
} from "@school-gate/contracts";
import type { ApiEnv } from "../context.js";
import { parseBody } from "../middleware/parseJson.js";
import { handler } from "../routing/route.js";
import { useResponse } from "../middleware/response.js";
import { defineRoute } from "../openapi/defineRoute.js";

export type AccessEventsModule = {
    ingest: (input: AccessEventIngestInput) => Promise<AccessEventIngestResult>;
    ingestBatch: (input: AccessEventIngestBatchInput) => Promise<{ results: Array<AccessEventIngestResult & { eventId: string }> }>;
};

export type AccessEventsRoutesInput = {
    verifyIngestAuth: MiddlewareHandler<ApiEnv>;
    module: AccessEventsModule;
};

export function createAccessEventsRoutes(input: AccessEventsRoutesInput) {
    const app = new OpenAPIHono<ApiEnv>();

    const ingestHeadersSchema = z.object({
        authorization: z.string(),
        "x-timestamp": z.string(),
        "x-signature": z.string()
    });

    app.openapi(
        defineRoute({
            method: "post",
            path: "/events",
            tags: ["Ingest"],
            summary: "Ingest access event",
            middleware: [
                input.verifyIngestAuth,
                parseBody(accessEventIngestSchema),
                useResponse(accessEventIngestResultSchema)
            ],
            request: {
                headers: ingestHeadersSchema
            },
            success: { schema: accessEventIngestResultSchema },
            security: [{ ingestBearerAuth: [] }]
        }),
        handler<AccessEventIngestInput>(({ body }) => {
            return input.module.ingest(body as AccessEventIngestInput);
        })
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/events/batch",
            tags: ["Ingest"],
            summary: "Ingest access event batch",
            middleware: [
                input.verifyIngestAuth,
                parseBody(accessEventIngestBatchSchema),
                useResponse(accessEventIngestBatchResultSchema)
            ],
            request: {
                headers: ingestHeadersSchema
            },
            success: { schema: accessEventIngestBatchResultSchema },
            security: [{ ingestBearerAuth: [] }]
        }),
        handler<AccessEventIngestBatchInput>(({ body }) => input.module.ingestBatch(body as AccessEventIngestBatchInput))
    );

    return app;
}




