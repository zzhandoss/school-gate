import { OpenAPIHono, z } from "@hono/zod-openapi";
import type { AdapterEventsInput, AdapterHeartbeatInput, AdapterRegisterInput } from "../../../contracts.js";
import { adapterEventsSchema, adapterHeartbeatSchema, adapterRegisterSchema } from "../../../contracts.js";
import { parseBody } from "../middleware/parseBody.js";
import { requireBearer } from "../middleware/requireBearer.js";
import { useResponse } from "../middleware/response.js";
import { defineRoute } from "../openapi/defineRoute.js";
import { handler } from "../routing/handler.js";
import type { ApiEnv } from "../context.js";
import type { AdapterIngressModule } from "../../../composition/features/adapters/adapterIngress.feature.js";

const assignmentsResponseSchema = z.object({
    adapterId: z.string().min(1),
    instanceKey: z.string().min(1),
    instanceName: z.string().min(1),
    mode: z.enum(["active", "draining"]),
    heartbeatIntervalMs: z.number().int().positive(),
    batchLimit: z.number().int().positive(),
    devices: z.array(
        z.object({
            deviceId: z.string().min(1),
            direction: z.enum(["IN", "OUT"]),
            settingsJson: z.string().nullable(),
        })
    ),
});

const ingestEventsResultSchema = z.object({
    results: z.array(
        z.object({
            eventId: z.string().min(1),
            result: z.enum(["inserted", "duplicate"]),
            deviceEventId: z.string().min(1).nullable(),
        })
    ),
});

export function createAdapterIngressRoutes(input: {
    token: string;
    module: AdapterIngressModule;
}) {
    const app = new OpenAPIHono<ApiEnv>();
    const adapterBearer = requireBearer(input.token);

    app.openapi(
        defineRoute({
            method: "post",
            path: "/register",
            tags: ["Adapters"],
            summary: "Register adapter session",
            request: { body: adapterRegisterSchema },
            middleware: [adapterBearer, parseBody(adapterRegisterSchema), useResponse(assignmentsResponseSchema)],
            success: { schema: assignmentsResponseSchema },
            errors: [400, 401, 500],
            security: [{ deviceBearerAuth: [] }],
        }),
        handler<AdapterRegisterInput>(({ body }) => input.module.register(body!))
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/heartbeat",
            tags: ["Adapters"],
            summary: "Heartbeat adapter session",
            request: { body: adapterHeartbeatSchema },
            middleware: [adapterBearer, parseBody(adapterHeartbeatSchema), useResponse(assignmentsResponseSchema)],
            success: { schema: assignmentsResponseSchema },
            errors: [400, 401, 404, 500],
            security: [{ deviceBearerAuth: [] }],
        }),
        handler<AdapterHeartbeatInput>(({ body }) => input.module.heartbeat(body!))
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/events",
            tags: ["Adapters"],
            summary: "Ingest adapter events",
            request: { body: adapterEventsSchema },
            middleware: [adapterBearer, parseBody(adapterEventsSchema), useResponse(ingestEventsResultSchema)],
            success: { schema: ingestEventsResultSchema },
            errors: [400, 401, 403, 404, 409, 500],
            security: [{ deviceBearerAuth: [] }],
        }),
        handler<AdapterEventsInput>(({ body }) => input.module.ingestEvents(body!))
    );

    return app;
}
