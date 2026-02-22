import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { Scalar } from "@scalar/hono-api-reference";
import { z } from "zod";
import {
    changeMyPasswordResultSchema,
    changeMyPasswordSchema,
    updateMyProfileResultSchema,
    updateMyProfileSchema,
    type ChangeMyPasswordDto,
    type UpdateMyProfileDto
} from "@school-gate/contracts";
import type { AppLogger } from "@school-gate/infra";
import type { ApiEnv } from "./context.js";
import { requestContext } from "./middleware/requestContext.js";
import { parseBody } from "./middleware/parseJson.js";
import { requireAdmin } from "./middleware/requireAdmin.js";
import { useResponse } from "./middleware/response.js";
import { createAccessEventsRoutes, type AccessEventsRoutesInput } from "./routes/accessEvents.routes.js";
import { createAccessEventsAdminRoutes, type AccessEventsAdminModule } from "./routes/accessEventsAdmin.routes.js";
import { createAdminAuthRoutes } from "./routes/adminAuth.routes.js";
import { createAdminsRoutes, type AdminsModule } from "./routes/admins.routes.js";
import { createAlertsRoutes, type AlertsModule } from "./routes/alerts.routes.js";
import { createMonitoringRoutes, type MonitoringModule } from "./routes/monitoring.routes.js";
import { createPersonsRoutes, type PersonsModule } from "./routes/persons.routes.js";
import { createRetentionRoutes, type RetentionModule } from "./routes/retention.routes.js";
import {
    createDeviceServiceGatewayRoutes,
    type DeviceServiceGatewayModule
} from "./routes/deviceServiceGateway.routes.js";
import { createRuntimeSettingsRoutes, type RuntimeSettingsModule } from "./routes/runtimeSettings.routes.js";
import { createSubscriptionsRoutes, type SubscriptionsModule } from "./routes/subscriptions.routes.js";
import {
    createSubscriptionRequestsRoutes,
    type SubscriptionRequestsModule
} from "./routes/subscriptionRequests.routes.js";
import { createAuditLogsRoutes, type AuditLogsModule } from "./routes/auditLogs.routes.js";
import { fail } from "./response.js";
import type { AdminAuth } from "./middleware/adminAuth.js";
import type { AdminAuthModule } from "./routes/adminAuth.routes.js";
import { HttpError } from "./errors/httpError.js";
import { mapErrorToFailure } from "./errors/mapErrorToFailure.js";
import { defineRoute } from "./openapi/defineRoute.js";
import { handler } from "./routing/route.js";
export type { RuntimeSettingsModule } from "./routes/runtimeSettings.routes.js";

export type CreateHttpAppInput = {
    logger: AppLogger;
    corsAllowedOrigins?: string[];
    authCookies?: {
        accessCookieName: string;
        refreshCookieName: string;
        path: string;
        secure: boolean;
        sameSite: "strict" | "lax" | "none";
    };
    adminAccessTtlMs?: number;
    adminRefreshTtlMs?: number;
    adminAuth: AdminAuth;
    adminAuthModule: AdminAuthModule;
    admins: AdminsModule;
    runtimeSettings: RuntimeSettingsModule;
    accessEvents: AccessEventsRoutesInput;
    accessEventsAdmin: AccessEventsAdminModule;
    persons: PersonsModule;
    subscriptionRequests: SubscriptionRequestsModule;
    subscriptions: SubscriptionsModule;
    retention: RetentionModule;
    monitoring: MonitoringModule;
    deviceServiceGateway?: DeviceServiceGatewayModule;
    auditLogs: AuditLogsModule;
    alerts: AlertsModule;
};

export function createHttpApp(input: CreateHttpAppInput) {
    const app = new OpenAPIHono<ApiEnv>();
    const corsAllowedOrigins = new Set(input.corsAllowedOrigins ?? ["http://localhost:5000"]);
    const authCookies = input.authCookies ?? {
        accessCookieName: "sg_admin_access",
        refreshCookieName: "sg_admin_refresh",
        path: "/",
        secure: true,
        sameSite: "lax"
    };

    app.use("*", requestContext(input.logger));
    app.use(
        "/api/*",
        cors({
            origin: (origin) => (origin && corsAllowedOrigins.has(origin) ? origin : undefined),
            allowMethods: ["GET", "HEAD", "PUT", "POST", "PATCH", "DELETE", "OPTIONS"],
            allowHeaders: ["Authorization", "Content-Type"],
            credentials: true
        })
    );

    const openApiDocumentConfig = {
        openapi: "3.0.0",
        info: {
            title: "School Gate API",
            version: "1.0.0"
        },
        components: {
            securitySchemes: {
                adminBearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                },
                ingestBearerAuth: {
                    type: "http",
                    scheme: "bearer"
                }
            }
        }
    };

    app.get("/openapi.json", (c) => {
        try {
            const document = app.getOpenAPIDocument(openApiDocumentConfig as any);
            return c.json(document);
        } catch (err) {
            const logger = c.get("logger") ?? input.logger;
            logger.error({ err }, "failed to generate openapi document");
            return c.json({
                code: "openapi_generation_failed",
                message: "Failed to generate OpenAPI document"
            }, 500);
        }
    });

    app.get("/docs", Scalar({ url: "/openapi.json", pageTitle: "School Gate API" }));

    app.openapi(
        defineRoute({
            method: "get",
            path: "/health",
            tags: ["System"],
            summary: "Healthcheck",
            success: { schema: z.object({ ok: z.literal(true) }) },
            errors: [500]
        }),
        handler(() => ({ ok: true }))
    );

    app.openapi(
        defineRoute({
            method: "patch",
            path: "/api/me",
            tags: ["Admin Auth"],
            summary: "Update current admin profile (alias)",
            middleware: [input.adminAuth.verify, requireAdmin(), parseBody(updateMyProfileSchema), useResponse(updateMyProfileResultSchema)],
            request: { body: updateMyProfileSchema },
            success: { schema: updateMyProfileResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<UpdateMyProfileDto>(({ c, body }) => {
            return input.adminAuthModule.updateMyProfile({
                ...(body as UpdateMyProfileDto),
                adminId: c.get("adminId") as string
            });
        })
    );

    app.openapi(
        defineRoute({
            method: "patch",
            path: "/api/me/password",
            tags: ["Admin Auth"],
            summary: "Change current admin password (alias)",
            middleware: [input.adminAuth.verify, requireAdmin(), parseBody(changeMyPasswordSchema), useResponse(changeMyPasswordResultSchema)],
            request: { body: changeMyPasswordSchema },
            success: { schema: changeMyPasswordResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<ChangeMyPasswordDto>(({ c, body }) => {
            return input.adminAuthModule.changeMyPassword({
                ...(body as ChangeMyPasswordDto),
                adminId: c.get("adminId") as string
            });
        })
    );

    app.route("/api", createAccessEventsRoutes(input.accessEvents));
    app.route("/api/auth", createAdminAuthRoutes({
        module: input.adminAuthModule,
        auth: input.adminAuth,
        cookies: authCookies,
        accessTtlMs: input.adminAccessTtlMs ?? 12 * 60 * 60 * 1000,
        refreshTtlMs: input.adminRefreshTtlMs ?? 30 * 24 * 60 * 60 * 1000
    }));
    app.route("/api/admins", createAdminsRoutes({ module: input.admins, auth: input.adminAuth }));
    app.route("/api/runtime-settings", createRuntimeSettingsRoutes({ module: input.runtimeSettings, auth: input.adminAuth }));
    app.route("/api/access-events", createAccessEventsAdminRoutes({ module: input.accessEventsAdmin, auth: input.adminAuth }));
    app.route("/api/persons", createPersonsRoutes({ module: input.persons, auth: input.adminAuth }));
    app.route(
        "/api/subscription-requests",
        createSubscriptionRequestsRoutes({ module: input.subscriptionRequests, auth: input.adminAuth })
    );
    app.route("/api/subscriptions", createSubscriptionsRoutes({ module: input.subscriptions, auth: input.adminAuth }));
    app.route("/api/retention", createRetentionRoutes({ module: input.retention, auth: input.adminAuth }));
    app.route("/api/monitoring", createMonitoringRoutes({ module: input.monitoring, auth: input.adminAuth }));
    if (input.deviceServiceGateway) {
        app.route("/api/ds", createDeviceServiceGatewayRoutes({ module: input.deviceServiceGateway, auth: input.adminAuth }));
    }
    app.route("/api/alerts", createAlertsRoutes({ module: input.alerts, auth: input.adminAuth }));
    app.route("/api/audit-logs", createAuditLogsRoutes({ module: input.auditLogs, auth: input.adminAuth }));

    const toErrorLog = (err: unknown) => {
        if (err instanceof Error) {
            return { name: err.name, message: err.message };
        }
        return { message: String(err) };
    };

    app.onError((err, c) => {
        const logger = c.get("logger") ?? input.logger;
        const mapped = mapErrorToFailure(err, c.get("errorMap"));
        if (mapped) {
            if (err instanceof HttpError) {
                logger.warn({ error: toErrorLog(err), response: mapped }, "request failed");
            } else {
                logger.error({ error: toErrorLog(err), response: mapped }, "internal validation error");
            }
            return fail(c, mapped);
        }

        logger.error({ error: toErrorLog(err) }, "unhandled error");
        return fail(c, {
            status: 500,
            code: "internal_error",
            message: "Unhandled server error"
        });
    });

    return app;
}
