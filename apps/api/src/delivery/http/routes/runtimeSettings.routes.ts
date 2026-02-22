import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import type { SetRuntimeSettingsInput } from "@school-gate/core";
import {
    runtimeSettingsSnapshotSchema,
    setRuntimeSettingsSchema,
    type RuntimeSettingsSnapshotDto,
    type SetRuntimeSettingsDto
} from "@school-gate/contracts";
import type { ApiEnv } from "../context.js";
import type { AdminAuth } from "../middleware/adminAuth.js";
import { parseBody } from "../middleware/parseJson.js";
import { useResponse } from "../middleware/response.js";
import { handler } from "../routing/route.js";
import { defineRoute } from "../openapi/defineRoute.js";

export type RuntimeSettingsModule = {
    list: () => RuntimeSettingsSnapshotDto;
    set: (input: SetRuntimeSettingsInput, adminId?: string | undefined) => { updated: number };
};

export function createRuntimeSettingsRoutes(input: { module: RuntimeSettingsModule; auth: AdminAuth }) {
    const app = new OpenAPIHono<ApiEnv>();

    app.use("*", input.auth.verify);

    app.openapi(
        defineRoute({
            method: "get",
            path: "/",
            tags: ["Runtime Settings"],
            summary: "Get runtime settings snapshot",
            middleware: [input.auth.requirePermissions(["settings.read"]), useResponse(runtimeSettingsSnapshotSchema)],
            success: { schema: runtimeSettingsSnapshotSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler(() => input.module.list())
    );

    app.openapi(
        defineRoute({
            method: "patch",
            path: "/",
            tags: ["Runtime Settings"],
            summary: "Update runtime settings",
            middleware: [input.auth.requirePermissions(["settings.write"]), parseBody(setRuntimeSettingsSchema)],
            request: { body: setRuntimeSettingsSchema },
            success: { schema: z.object({ updated: z.number().int() }) },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<SetRuntimeSettingsDto>(({ c, body }) =>
            input.module.set(
                body as unknown as SetRuntimeSettingsInput,
                c.get("admin")?.adminId
            )
        )
    );

    return app;
}
