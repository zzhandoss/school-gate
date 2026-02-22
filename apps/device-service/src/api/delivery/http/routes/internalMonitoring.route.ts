import { OpenAPIHono, z } from "@hono/zod-openapi";
import { requireBearer } from "../middleware/requireBearer.js";
import { useResponse } from "../middleware/response.js";
import { defineRoute } from "../openapi/defineRoute.js";
import { handler } from "../routing/handler.js";
import type { ApiEnv } from "../context.js";
import type { MonitoringModule } from "../../../composition/features/monitoring/monitoring.feature.js";

const monitoringSchema = z.object({
    adapters: z.array(
        z.object({
            adapterId: z.string().min(1),
            vendorKey: z.string().min(1),
            instanceKey: z.string().min(1),
            instanceName: z.string().min(1),
            baseUrl: z.string().min(1),
            mode: z.enum(["active", "draining"]),
            lastSeenAt: z.string().min(1),
            status: z.enum(["ok", "stale"]),
            ttlMs: z.number().int().positive(),
        })
    ),
    devices: z.array(
        z.object({
            deviceId: z.string().min(1),
            name: z.string().nullable(),
            adapterKey: z.string().min(1),
            lastEventAt: z.string().nullable(),
            status: z.enum(["ok", "stale"]),
            ttlMs: z.number().int().positive(),
        })
    ),
    outbox: z.object({
        counts: z.record(z.string(), z.number()),
        oldestNewCreatedAt: z.string().nullable(),
    }),
});

export function createInternalMonitoringRoutes(input: {
    token: string;
    module: MonitoringModule;
}) {
    const app = new OpenAPIHono<ApiEnv>();

    app.openapi(
        defineRoute({
            method: "get",
            path: "/",
            tags: ["Internal"],
            summary: "Device service internal monitoring",
            middleware: [requireBearer(input.token), useResponse(monitoringSchema)],
            success: { schema: monitoringSchema },
            errors: [401, 500],
            security: [{ internalBearerAuth: [] }],
        }),
        handler(() => input.module.getSnapshot())
    );

    return app;
}
