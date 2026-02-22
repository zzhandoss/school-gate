import { OpenAPIHono } from "@hono/zod-openapi";
import { listDeviceServiceAdaptersResultSchema } from "@school-gate/contracts";
import { useResponse } from "../middleware/response.js";
import { defineRoute } from "../openapi/defineRoute.js";
import { handler } from "../routing/handler.js";
import type { ApiEnv } from "../context.js";
import type { AdminAuth } from "../middleware/adminAuth.js";
import type { AdaptersAdminModule } from "../../../composition/features/adapters/adaptersAdmin.feature.js";

export function createAdaptersRoutes(input: {
    module: AdaptersAdminModule;
    auth: AdminAuth;
}) {
    const app = new OpenAPIHono<ApiEnv>();

    app.use("*", input.auth.verify);

    app.openapi(
        defineRoute({
            method: "get",
            path: "/",
            tags: ["Adapters"],
            summary: "List adapters",
            middleware: [input.auth.requirePermissions(["devices.read"]), useResponse(listDeviceServiceAdaptersResultSchema)],
            success: { schema: listDeviceServiceAdaptersResultSchema },
            errors: [401, 403, 500],
            security: [{ adminBearerAuth: [] }]
        }),
        handler(() => input.module.list())
    );

    return app;
}
