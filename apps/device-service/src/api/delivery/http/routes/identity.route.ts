import { OpenAPIHono } from "@hono/zod-openapi";
import {
    deviceServiceIdentityFindResultSchema,
    deviceServiceIdentityFindSchema,
    type DeviceServiceIdentityFindDto
} from "@school-gate/contracts";
import { requireBearer } from "../middleware/requireBearer.js";
import { parseBody } from "../middleware/parseBody.js";
import { useResponse } from "../middleware/response.js";
import { defineRoute } from "../openapi/defineRoute.js";
import { handler } from "../routing/handler.js";
import type { ApiEnv } from "../context.js";
import type { IdentityModule } from "../../../composition/features/identity/identity.feature.js";

export function createIdentityRoutes(input: {
    token: string;
    module: IdentityModule;
}) {
    const app = new OpenAPIHono<ApiEnv>();

    app.openapi(
        defineRoute({
            method: "post",
            path: "/find",
            tags: ["Identity"],
            summary: "Resolve identity across adapter devices",
            middleware: [requireBearer(input.token), parseBody(deviceServiceIdentityFindSchema), useResponse(deviceServiceIdentityFindResultSchema)],
            request: { body: deviceServiceIdentityFindSchema },
            success: { schema: deviceServiceIdentityFindResultSchema },
            errors: [400, 401, 500],
            security: [{ deviceBearerAuth: [] }]
        }),
        handler<DeviceServiceIdentityFindDto>(({ body }) => input.module.find(body!))
    );

    return app;
}
