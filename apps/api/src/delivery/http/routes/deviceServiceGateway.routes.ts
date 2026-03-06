import { OpenAPIHono } from "@hono/zod-openapi";
import {
    deviceServiceIdentityExportUsersResultSchema,
    deviceServiceIdentityExportUsersSchema,
    deviceServiceIdentityBulkCreateUsersResultSchema,
    deviceServiceIdentityBulkCreateUsersSchema,
    deviceServiceIdentityGetUserPhotoResultSchema,
    deviceServiceIdentityGetUserPhotoSchema,
    deviceServiceIdentityWriteUsersResultSchema,
    deviceServiceIdentityWriteUsersSchema,
    deviceServiceIdentityFindResultSchema,
    deviceServiceIdentityFindSchema,
    deviceServiceMonitoringSchema,
    getDeviceServiceDeviceResultSchema,
    listDeviceServiceAdaptersResultSchema,
    listDeviceServiceDevicesResultSchema,
    setDeviceServiceDeviceEnabledSchema,
    upsertDeviceServiceDeviceSchema,
    updateDeviceServiceDeviceSchema,
    type GetDeviceServiceDeviceResultDto,
    type DeviceServiceIdentityFindDto,
    type DeviceServiceIdentityFindResultDto,
    type DeviceServiceIdentityExportUsersDto,
    type DeviceServiceIdentityExportUsersResultDto,
    type DeviceServiceIdentityBulkCreateUsersDto,
    type DeviceServiceIdentityBulkCreateUsersResultDto,
    type DeviceServiceIdentityGetUserPhotoDto,
    type DeviceServiceIdentityGetUserPhotoResultDto,
    type DeviceServiceIdentityWriteUsersDto,
    type DeviceServiceIdentityWriteUsersResultDto,
    type ListDeviceServiceAdaptersResultDto,
    type ListDeviceServiceDevicesResultDto,
    type SetDeviceServiceDeviceEnabledDto,
    type UpdateDeviceServiceDeviceDto,
    type UpsertDeviceServiceDeviceDto
} from "@school-gate/contracts";
import { z } from "zod";
import type { Context } from "hono";
import type { ApiEnv } from "../context.js";
import type { AdminAuth, AdminContext } from "../middleware/adminAuth.js";
import { parseBody } from "../middleware/parseJson.js";
import { useResponse } from "../middleware/response.js";
import { defineRoute, okSchema } from "../openapi/defineRoute.js";
import { handler } from "../routing/route.js";

type GatewayRequestMeta = {
    authorizationHeader: string | undefined;
    admin: AdminContext | undefined;
};

type DeviceServiceMonitoringDto = z.infer<typeof deviceServiceMonitoringSchema>;

export type DeviceServiceGatewayModule = {
    listDevices: (meta: GatewayRequestMeta) => Promise<ListDeviceServiceDevicesResultDto>;
    getDevice: (input: { deviceId: string } & GatewayRequestMeta) => Promise<GetDeviceServiceDeviceResultDto>;
    upsertDevice: (input: { payload: UpsertDeviceServiceDeviceDto } & GatewayRequestMeta) => Promise<{ ok: true }>;
    updateDevice: (input: { deviceId: string; payload: UpdateDeviceServiceDeviceDto } & GatewayRequestMeta) => Promise<{ ok: true }>;
    setDeviceEnabled: (input: { deviceId: string; payload: SetDeviceServiceDeviceEnabledDto } & GatewayRequestMeta) => Promise<{ ok: true }>;
    deleteDevice: (input: { deviceId: string } & GatewayRequestMeta) => Promise<{ ok: true }>;
    listAdapters: (meta: GatewayRequestMeta) => Promise<ListDeviceServiceAdaptersResultDto>;
    getMonitoring: (meta: GatewayRequestMeta) => Promise<DeviceServiceMonitoringDto>;
    findIdentity: (input: { payload: DeviceServiceIdentityFindDto } & GatewayRequestMeta) => Promise<DeviceServiceIdentityFindResultDto>;
    exportUsers: (input: { payload: DeviceServiceIdentityExportUsersDto } & GatewayRequestMeta) => Promise<DeviceServiceIdentityExportUsersResultDto>;
    bulkCreateUsers: (input: { payload: DeviceServiceIdentityBulkCreateUsersDto } & GatewayRequestMeta) => Promise<DeviceServiceIdentityBulkCreateUsersResultDto>;
    getUserPhoto: (input: { payload: DeviceServiceIdentityGetUserPhotoDto } & GatewayRequestMeta) => Promise<DeviceServiceIdentityGetUserPhotoResultDto>;
    createUsers: (input: { payload: DeviceServiceIdentityWriteUsersDto } & GatewayRequestMeta) => Promise<DeviceServiceIdentityWriteUsersResultDto>;
    updateUsers: (input: { payload: DeviceServiceIdentityWriteUsersDto } & GatewayRequestMeta) => Promise<DeviceServiceIdentityWriteUsersResultDto>;
};

const deviceIdParamsSchema = z.object({ deviceId: z.string().min(1) });

function getMeta(c: Context<ApiEnv>): GatewayRequestMeta {
    return {
        authorizationHeader: c.req.header("authorization"),
        admin: c.get("admin")
    };
}

export function createDeviceServiceGatewayRoutes(input: {
    module: DeviceServiceGatewayModule;
    auth: AdminAuth;
}) {
    const app = new OpenAPIHono<ApiEnv>();

    app.use("*", input.auth.verify);

    app.openapi(
        defineRoute({
            method: "get",
            path: "/devices",
            tags: ["Device Service Gateway"],
            summary: "List device-service devices",
            middleware: [input.auth.requirePermissions(["devices.read"]), useResponse(listDeviceServiceDevicesResultSchema)],
            success: { schema: listDeviceServiceDevicesResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler(({ c }) => input.module.listDevices(getMeta(c)))
    );

    app.openapi(
        defineRoute({
            method: "get",
            path: "/devices/:deviceId",
            tags: ["Device Service Gateway"],
            summary: "Get device-service device",
            request: { params: deviceIdParamsSchema },
            middleware: [input.auth.requirePermissions(["devices.read"]), useResponse(getDeviceServiceDeviceResultSchema)],
            success: { schema: getDeviceServiceDeviceResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<unknown, unknown, { deviceId: string }>(({ c, params }) =>
            input.module.getDevice({ deviceId: params.deviceId, ...getMeta(c) })
        )
    );

    app.openapi(
        defineRoute({
            method: "put",
            path: "/devices",
            tags: ["Device Service Gateway"],
            summary: "Upsert device-service device",
            request: { body: upsertDeviceServiceDeviceSchema },
            middleware: [input.auth.requirePermissions(["devices.write"]), parseBody(upsertDeviceServiceDeviceSchema), useResponse(okSchema)],
            success: { schema: okSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<UpsertDeviceServiceDeviceDto>(({ c, body }) => input.module.upsertDevice({ payload: body!, ...getMeta(c) }))
    );

    app.openapi(
        defineRoute({
            method: "patch",
            path: "/devices/:deviceId",
            tags: ["Device Service Gateway"],
            summary: "Update device-service device",
            request: { params: deviceIdParamsSchema, body: updateDeviceServiceDeviceSchema },
            middleware: [input.auth.requirePermissions(["devices.write"]), parseBody(updateDeviceServiceDeviceSchema), useResponse(okSchema)],
            success: { schema: okSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<UpdateDeviceServiceDeviceDto, unknown, { deviceId: string }>(({ c, params, body }) =>
            input.module.updateDevice({ deviceId: params.deviceId, payload: body!, ...getMeta(c) })
        )
    );

    app.openapi(
        defineRoute({
            method: "patch",
            path: "/devices/:deviceId/enabled",
            tags: ["Device Service Gateway"],
            summary: "Set device-service device enabled",
            request: { params: deviceIdParamsSchema, body: setDeviceServiceDeviceEnabledSchema },
            middleware: [
                input.auth.requirePermissions(["devices.write"]),
                parseBody(setDeviceServiceDeviceEnabledSchema),
                useResponse(okSchema)
            ],
            success: { schema: okSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<SetDeviceServiceDeviceEnabledDto, unknown, { deviceId: string }>(({ c, params, body }) =>
            input.module.setDeviceEnabled({ deviceId: params.deviceId, payload: body!, ...getMeta(c) })
        )
    );

    app.openapi(
        defineRoute({
            method: "delete",
            path: "/devices/:deviceId",
            tags: ["Device Service Gateway"],
            summary: "Delete device-service device",
            request: { params: deviceIdParamsSchema },
            middleware: [input.auth.requirePermissions(["devices.write"]), useResponse(okSchema)],
            success: { schema: okSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<unknown, unknown, { deviceId: string }>(({ c, params }) =>
            input.module.deleteDevice({ deviceId: params.deviceId, ...getMeta(c) })
        )
    );

    app.openapi(
        defineRoute({
            method: "get",
            path: "/adapters",
            tags: ["Device Service Gateway"],
            summary: "List device-service adapters",
            middleware: [input.auth.requirePermissions(["devices.read"]), useResponse(listDeviceServiceAdaptersResultSchema)],
            success: { schema: listDeviceServiceAdaptersResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler(({ c }) => input.module.listAdapters(getMeta(c)))
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/identity/find",
            tags: ["Device Service Gateway"],
            summary: "Resolve identity via device-service",
            request: { body: deviceServiceIdentityFindSchema },
            middleware: [input.auth.requirePermissions(["persons.write"]), parseBody(deviceServiceIdentityFindSchema), useResponse(deviceServiceIdentityFindResultSchema)],
            success: { schema: deviceServiceIdentityFindResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<DeviceServiceIdentityFindDto>(({ c, body }) => input.module.findIdentity({ payload: body!, ...getMeta(c) }))
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/identity/export-users",
            tags: ["Device Service Gateway"],
            summary: "Export terminal users via device-service",
            request: { body: deviceServiceIdentityExportUsersSchema },
            middleware: [input.auth.requirePermissions(["persons.read"]), parseBody(deviceServiceIdentityExportUsersSchema), useResponse(deviceServiceIdentityExportUsersResultSchema)],
            success: { schema: deviceServiceIdentityExportUsersResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<DeviceServiceIdentityExportUsersDto>(({ c, body }) =>
            input.module.exportUsers({ payload: body!, ...getMeta(c) })
        )
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/identity/users/photo/get",
            tags: ["Device Service Gateway"],
            summary: "Read terminal user photo via device-service",
            request: { body: deviceServiceIdentityGetUserPhotoSchema },
            middleware: [input.auth.requirePermissions(["persons.read"]), parseBody(deviceServiceIdentityGetUserPhotoSchema), useResponse(deviceServiceIdentityGetUserPhotoResultSchema)],
            success: { schema: deviceServiceIdentityGetUserPhotoResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<DeviceServiceIdentityGetUserPhotoDto>(({ c, body }) =>
            input.module.getUserPhoto({ payload: body!, ...getMeta(c) })
        )
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/identity/users/bulk-create",
            tags: ["Device Service Gateway"],
            summary: "Create multiple terminal users via device-service",
            request: { body: deviceServiceIdentityBulkCreateUsersSchema },
            middleware: [input.auth.requirePermissions(["persons.write"]), parseBody(deviceServiceIdentityBulkCreateUsersSchema), useResponse(deviceServiceIdentityBulkCreateUsersResultSchema)],
            success: { schema: deviceServiceIdentityBulkCreateUsersResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<DeviceServiceIdentityBulkCreateUsersDto>(({ c, body }) =>
            input.module.bulkCreateUsers({ payload: body!, ...getMeta(c) })
        )
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/identity/users/create",
            tags: ["Device Service Gateway"],
            summary: "Create terminal users via device-service",
            request: { body: deviceServiceIdentityWriteUsersSchema },
            middleware: [input.auth.requirePermissions(["persons.write"]), parseBody(deviceServiceIdentityWriteUsersSchema), useResponse(deviceServiceIdentityWriteUsersResultSchema)],
            success: { schema: deviceServiceIdentityWriteUsersResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<DeviceServiceIdentityWriteUsersDto>(({ c, body }) =>
            input.module.createUsers({ payload: body!, ...getMeta(c) })
        )
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/identity/users/update",
            tags: ["Device Service Gateway"],
            summary: "Update terminal users via device-service",
            request: { body: deviceServiceIdentityWriteUsersSchema },
            middleware: [input.auth.requirePermissions(["persons.write"]), parseBody(deviceServiceIdentityWriteUsersSchema), useResponse(deviceServiceIdentityWriteUsersResultSchema)],
            success: { schema: deviceServiceIdentityWriteUsersResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<DeviceServiceIdentityWriteUsersDto>(({ c, body }) =>
            input.module.updateUsers({ payload: body!, ...getMeta(c) })
        )
    );

    app.openapi(
        defineRoute({
            method: "get",
            path: "/monitoring",
            tags: ["Device Service Gateway"],
            summary: "Get device-service monitoring",
            middleware: [input.auth.requirePermissions(["devices.read"]), useResponse(deviceServiceMonitoringSchema)],
            success: { schema: deviceServiceMonitoringSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler(({ c }) => input.module.getMonitoring(getMeta(c)))
    );

    return app;
}
