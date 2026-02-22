import type { CreateHttpAppInput } from "../delivery/http/createHttpApp.js";
import type { ApiRuntime } from "../runtime/createRuntime.js";
import { createAdminsFeature } from "./features/admins.feature.js";
import { createAlertsFeature } from "./features/alerts.feature.js";
import { createAuditFeature } from "./features/audit.feature.js";
import { createAuthFeature } from "./features/auth.feature.js";
import { createDeviceServiceGatewayFeature } from "./features/deviceServiceGateway.feature.js";
import { createEventsFeature } from "./features/events.feature.js";
import { createMonitoringFeature } from "./features/monitoring.feature.js";
import { createRetentionFeature } from "./features/retention.feature.js";
import { createSettingsFeature } from "./features/settings.feature.js";
import { createSubscriptionsFeature } from "./features/subscriptions.feature.js";

export function createApiComposition(runtime: ApiRuntime): CreateHttpAppInput {
    const auth = createAuthFeature(runtime);
    const deviceServiceGateway = createDeviceServiceGatewayFeature(runtime);
    const events = createEventsFeature(runtime, deviceServiceGateway);
    const subscriptions = createSubscriptionsFeature(runtime);

    return {
        logger: runtime.logger,
        corsAllowedOrigins: runtime.apiConfig.corsAllowedOrigins,
        authCookies: {
            accessCookieName: runtime.apiConfig.authAccessCookieName,
            refreshCookieName: runtime.apiConfig.authRefreshCookieName,
            path: runtime.apiConfig.authCookiePath,
            secure: runtime.apiConfig.authCookieSecure,
            sameSite: runtime.apiConfig.authCookieSameSite
        },
        adminAccessTtlMs: runtime.apiConfig.adminJwtTtlMs,
        adminRefreshTtlMs: runtime.apiConfig.adminRefreshTtlMs,
        adminAuth: auth.adminAuth,
        adminAuthModule: auth.adminAuthModule,
        admins: createAdminsFeature(runtime, auth),
        runtimeSettings: createSettingsFeature(runtime),
        accessEvents: events.accessEvents,
        accessEventsAdmin: events.accessEventsAdmin,
        persons: events.persons,
        subscriptionRequests: subscriptions.subscriptionRequests,
        subscriptions: subscriptions.subscriptions,
        retention: createRetentionFeature(runtime),
        monitoring: createMonitoringFeature(runtime),
        deviceServiceGateway,
        alerts: createAlertsFeature(runtime),
        auditLogs: createAuditFeature(runtime)
    };
}
