import { OpenAPIHono, z } from "@hono/zod-openapi";
import {
    getDeviceServiceDeviceResultSchema,
    listDeviceServiceDevicesResultSchema,
    setDeviceServiceDeviceEnabledSchema,
    upsertDeviceServiceDeviceSchema,
    updateDeviceServiceDeviceSchema
} from "@school-gate/contracts";
import type {
    SetDeviceServiceDeviceEnabledDto,
    UpdateDeviceServiceDeviceDto,
    UpsertDeviceServiceDeviceDto
} from "@school-gate/contracts";
import { parseBody } from "../middleware/parseBody.js";
import { useResponse } from "../middleware/response.js";
import { defineRoute } from "../openapi/defineRoute.js";
import { handler } from "../routing/handler.js";
import type { ApiEnv } from "../context.js";
import type { DevicesModule } from "../../../composition/features/devices/devices.feature.js";
import type { AdminAuth } from "../middleware/adminAuth.js";

const okSchema = z.object({ ok: z.literal(true) });
const deviceIdParamsSchema = z.object({ deviceId: z.string().min(1) });

export function createDevicesRoutes(input: {
    module: DevicesModule;
    auth: AdminAuth;
}) {
    const app = new OpenAPIHono<ApiEnv>();

    app.use("*", input.auth.verify);

    app.openapi(
        defineRoute({
            method: "get",
            path: "/",
            tags: ["Devices"],
            summary: "List devices",
            middleware: [input.auth.requirePermissions(["devices.read"]), useResponse(listDeviceServiceDevicesResultSchema)],
            success: { schema: listDeviceServiceDevicesResultSchema },
            errors: [401, 403, 500],
            security: [{ adminBearerAuth: [] }]
        }),
        handler(() => input.module.list())
    );

    app.openapi(
        defineRoute({
            method: "get",
            path: "/:deviceId",
            tags: ["Devices"],
            summary: "Get device",
            request: { params: deviceIdParamsSchema },
            middleware: [input.auth.requirePermissions(["devices.read"]), useResponse(getDeviceServiceDeviceResultSchema)],
            success: { schema: getDeviceServiceDeviceResultSchema },
            errors: [401, 403, 404, 500],
            security: [{ adminBearerAuth: [] }]
        }),
        handler<unknown, unknown, { deviceId: string }>(({ params }) => input.module.get(params.deviceId))
    );

    app.openapi(
        defineRoute({
            method: "put",
            path: "/",
            tags: ["Devices"],
            summary: "Upsert device",
            request: { body: upsertDeviceServiceDeviceSchema },
            middleware: [
                input.auth.requirePermissions(["devices.write"]),
                parseBody(upsertDeviceServiceDeviceSchema),
                useResponse(okSchema)
            ],
            success: { schema: okSchema },
            errors: [400, 401, 403, 500],
            security: [{ adminBearerAuth: [] }]
        }),
        handler<UpsertDeviceServiceDeviceDto>(({ body }) => input.module.upsert(body!))
    );

    app.openapi(
        defineRoute({
            method: "patch",
            path: "/:deviceId",
            tags: ["Devices"],
            summary: "Update device",
            request: { body: updateDeviceServiceDeviceSchema, params: deviceIdParamsSchema },
            middleware: [
                input.auth.requirePermissions(["devices.write"]),
                parseBody(updateDeviceServiceDeviceSchema),
                useResponse(okSchema)
            ],
            success: { schema: okSchema },
            errors: [400, 401, 403, 404, 500],
            security: [{ adminBearerAuth: [] }]
        }),
        handler<UpdateDeviceServiceDeviceDto, unknown, { deviceId: string }>(({ body, params }) =>
            input.module.update(params.deviceId, body!)
        )
    );

    app.openapi(
        defineRoute({
            method: "patch",
            path: "/:deviceId/enabled",
            tags: ["Devices"],
            summary: "Enable/disable device",
            request: { body: setDeviceServiceDeviceEnabledSchema, params: deviceIdParamsSchema },
            middleware: [
                input.auth.requirePermissions(["devices.write"]),
                parseBody(setDeviceServiceDeviceEnabledSchema),
                useResponse(okSchema)
            ],
            success: { schema: okSchema },
            errors: [400, 401, 403, 404, 500],
            security: [{ adminBearerAuth: [] }]
        }),
        handler<SetDeviceServiceDeviceEnabledDto, unknown, { deviceId: string }>(({ body, params }) =>
            input.module.setEnabled({ deviceId: params.deviceId, enabled: body!.enabled })
        )
    );

    app.openapi(
        defineRoute({
            method: "delete",
            path: "/:deviceId",
            tags: ["Devices"],
            summary: "Delete device",
            request: { params: deviceIdParamsSchema },
            middleware: [input.auth.requirePermissions(["devices.write"]), useResponse(okSchema)],
            success: { schema: okSchema },
            errors: [401, 403, 404, 500],
            security: [{ adminBearerAuth: [] }]
        }),
        handler<unknown, unknown, { deviceId: string }>(({ params }) => input.module.delete(params.deviceId))
    );

    return app;
}
