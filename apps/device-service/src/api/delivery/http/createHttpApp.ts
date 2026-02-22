import { OpenAPIHono, z } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { Scalar } from "@scalar/hono-api-reference";
import type { AppLogger } from "@school-gate/infra";
import type { ApiEnv } from "./context.js";
import type { AdminAuth } from "./middleware/adminAuth.js";
import { withRawBody } from "./middleware/rawBody.js";
import { fail } from "./response.js";
import { mapErrorToFailure } from "./errors/mapErrorToFailure.js";
import { defineRoute } from "./openapi/defineRoute.js";
import { handler } from "./routing/handler.js";
import { createAdapterIngressRoutes } from "./routes/adapterIngress.route.js";
import { createDevicesRoutes } from "./routes/devices.route.js";
import { createAdaptersRoutes } from "./routes/adapters.route.js";
import { createInternalMonitoringRoutes } from "./routes/internalMonitoring.route.js";
import { createIdentityRoutes } from "./routes/identity.route.js";
import type { AdapterIngressModule } from "../../composition/features/adapters/adapterIngress.feature.js";
import type { DevicesModule } from "../../composition/features/devices/devices.feature.js";
import type { AdaptersAdminModule } from "../../composition/features/adapters/adaptersAdmin.feature.js";
import type { MonitoringModule } from "../../composition/features/monitoring/monitoring.feature.js";
import type { IdentityModule } from "../../composition/features/identity/identity.feature.js";

export type CreateHttpAppInput = {
    logger: AppLogger;
    corsAllowedOrigins?: string[];
    adapterToken: string;
    internalToken: string;
    adminAuth: AdminAuth;
    adaptersIngress: AdapterIngressModule;
    devices: DevicesModule;
    adapters: AdaptersAdminModule;
    monitoring: MonitoringModule;
    identity: IdentityModule;
};

export function createHttpApp(input: CreateHttpAppInput) {
    const app = new OpenAPIHono<ApiEnv>();
    const corsAllowedOrigins = new Set(input.corsAllowedOrigins ?? ["http://localhost:3000"]);

    app.use("*", withRawBody());
    app.use(
        "/api/*",
        cors({
            origin: (origin) => (origin && corsAllowedOrigins.has(origin) ? origin : undefined),
            allowMethods: ["GET", "HEAD", "PUT", "POST", "PATCH", "DELETE", "OPTIONS"],
            allowHeaders: ["Authorization", "Content-Type"],
        })
    );
    app.use(
        "/admin/*",
        cors({
            origin: (origin) => (origin && corsAllowedOrigins.has(origin) ? origin : undefined),
            allowMethods: ["GET", "HEAD", "PUT", "POST", "PATCH", "DELETE", "OPTIONS"],
            allowHeaders: ["Authorization", "Content-Type"],
        })
    );

    const openApiDocumentConfig = {
        openapi: "3.0.0",
        info: {
            title: "School Gate Device Service API",
            version: "1.0.0",
        },
        components: {
            securitySchemes: {
                adminBearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
                deviceBearerAuth: {
                    type: "http",
                    scheme: "bearer",
                },
                internalBearerAuth: {
                    type: "http",
                    scheme: "bearer",
                },
            },
        },
    };

    app.get("/openapi.json", (c) => {
        try {
            return c.json(app.getOpenAPIDocument(openApiDocumentConfig as any));
        } catch (err) {
            input.logger.error({ err }, "failed to generate device-service openapi document");
            return c.json(
                {
                    code: "openapi_generation_failed",
                    message: "Failed to generate OpenAPI document",
                },
                500
            );
        }
    });

    app.get("/docs", Scalar({ url: "/openapi.json", pageTitle: "School Gate Device Service API" }));

    app.openapi(
        defineRoute({
            method: "get",
            path: "/health",
            tags: ["System"],
            summary: "Healthcheck",
            success: { schema: z.object({ ok: z.literal(true) }) },
            errors: [500],
        }),
        handler(() => ({ ok: true }))
    );

    app.route("/adapters", createAdapterIngressRoutes({ token: input.adapterToken, module: input.adaptersIngress }));
    app.route("/internal/monitoring", createInternalMonitoringRoutes({ token: input.internalToken, module: input.monitoring }));

    const adminDevices = createDevicesRoutes({ module: input.devices, auth: input.adminAuth });
    const adminAdapters = createAdaptersRoutes({ module: input.adapters, auth: input.adminAuth });

    app.route("/api/devices", adminDevices);
    app.route("/api/adapters", adminAdapters);
    app.route("/api/identity", createIdentityRoutes({ token: input.internalToken, module: input.identity }));

    app.route("/admin/devices", adminDevices);
    app.route("/admin/adapters", adminAdapters);

    app.notFound((c) => fail(c, { status: 404, code: "not_found", message: "Not found" }));

    app.onError((err, c) => {
        const mapped = mapErrorToFailure(err);
        if (mapped) {
            return fail(c, mapped);
        }

        input.logger.error({ err }, "unhandled device-service http error");
        return fail(c, { status: 500, code: "internal_error", message: "Unhandled server error" });
    });

    return app;
}
