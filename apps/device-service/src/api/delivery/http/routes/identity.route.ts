import { OpenAPIHono } from "@hono/zod-openapi";
import {
    deviceServiceIdentityExportUsersResultSchema,
    deviceServiceIdentityExportUsersSchema,
    type DeviceServiceIdentityExportUsersDto,
    deviceServiceIdentityBulkCreateUsersResultSchema,
    deviceServiceIdentityBulkCreateUsersSchema,
    type DeviceServiceIdentityBulkCreateUsersDto,
    deviceServiceIdentityGetUserPhotoResultSchema,
    deviceServiceIdentityGetUserPhotoSchema,
    type DeviceServiceIdentityGetUserPhotoDto,
    deviceServiceIdentityWriteUsersResultSchema,
    deviceServiceIdentityWriteUsersSchema,
    type DeviceServiceIdentityWriteUsersDto,
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

    app.openapi(
        defineRoute({
            method: "post",
            path: "/export-users",
            tags: ["Identity"],
            summary: "Export normalized terminal users across adapter devices",
            middleware: [requireBearer(input.token), parseBody(deviceServiceIdentityExportUsersSchema), useResponse(deviceServiceIdentityExportUsersResultSchema)],
            request: { body: deviceServiceIdentityExportUsersSchema },
            success: { schema: deviceServiceIdentityExportUsersResultSchema },
            errors: [400, 401, 500],
            security: [{ deviceBearerAuth: [] }]
        }),
        handler<DeviceServiceIdentityExportUsersDto>(({ body }) => input.module.exportUsers(body!))
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/users/photo/get",
            tags: ["Identity"],
            summary: "Read current face/photo for one terminal user",
            middleware: [requireBearer(input.token), parseBody(deviceServiceIdentityGetUserPhotoSchema), useResponse(deviceServiceIdentityGetUserPhotoResultSchema)],
            request: { body: deviceServiceIdentityGetUserPhotoSchema },
            success: { schema: deviceServiceIdentityGetUserPhotoResultSchema },
            errors: [400, 401, 404, 500],
            security: [{ deviceBearerAuth: [] }]
        }),
        handler<DeviceServiceIdentityGetUserPhotoDto>(({ body }) => input.module.getUserPhoto(body!))
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/users/bulk-create",
            tags: ["Identity"],
            summary: "Create multiple normalized terminal users across adapter devices",
            middleware: [requireBearer(input.token), parseBody(deviceServiceIdentityBulkCreateUsersSchema), useResponse(deviceServiceIdentityBulkCreateUsersResultSchema)],
            request: { body: deviceServiceIdentityBulkCreateUsersSchema },
            success: { schema: deviceServiceIdentityBulkCreateUsersResultSchema },
            errors: [400, 401, 500],
            security: [{ deviceBearerAuth: [] }]
        }),
        handler<DeviceServiceIdentityBulkCreateUsersDto>(({ body }) => input.module.bulkCreateUsers(body!))
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/users/create",
            tags: ["Identity"],
            summary: "Create normalized terminal users across adapter devices",
            middleware: [requireBearer(input.token), parseBody(deviceServiceIdentityWriteUsersSchema), useResponse(deviceServiceIdentityWriteUsersResultSchema)],
            request: { body: deviceServiceIdentityWriteUsersSchema },
            success: { schema: deviceServiceIdentityWriteUsersResultSchema },
            errors: [400, 401, 500],
            security: [{ deviceBearerAuth: [] }]
        }),
        handler<DeviceServiceIdentityWriteUsersDto>(({ body }) => input.module.createUsers(body!))
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/users/update",
            tags: ["Identity"],
            summary: "Update normalized terminal users across adapter devices",
            middleware: [requireBearer(input.token), parseBody(deviceServiceIdentityWriteUsersSchema), useResponse(deviceServiceIdentityWriteUsersResultSchema)],
            request: { body: deviceServiceIdentityWriteUsersSchema },
            success: { schema: deviceServiceIdentityWriteUsersResultSchema },
            errors: [400, 401, 500],
            security: [{ deviceBearerAuth: [] }]
        }),
        handler<DeviceServiceIdentityWriteUsersDto>(({ body }) => input.module.updateUsers(body!))
    );

    return app;
}
