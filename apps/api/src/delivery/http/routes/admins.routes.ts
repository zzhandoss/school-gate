import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import {
    createAdminPasswordResetResultSchema,
    createAdminPasswordResetSchema,
    listAdminsQuerySchema,
    listAdminsResultSchema,
    setAdminRoleSchema,
    setAdminStatusSchema,
    type CreateAdminPasswordResetDto,
    type ListAdminsResultDto,
    type SetAdminRoleDto,
    type SetAdminStatusDto
} from "@school-gate/contracts";
import type { ApiEnv } from "../context.js";
import type { AdminAuth } from "../middleware/adminAuth.js";
import { parseBody } from "../middleware/parseJson.js";
import { parseQuery } from "../middleware/parseQuery.js";
import { useResponse } from "../middleware/response.js";
import { handler } from "../routing/route.js";
import { defineRoute, okSchema } from "../openapi/defineRoute.js";

export type AdminsModule = {
    list: (input: { limit: number; offset: number }) => Promise<ListAdminsResultDto>;
    setStatus: (input: { adminId: string; status: "active" | "disabled"; actorId?: string }) => Promise<void>;
    setRole: (input: { adminId: string; roleId: string; actorId?: string }) => Promise<void>;
    createPasswordReset: (input: { adminId: string; expiresAt: Date; actorId?: string }) => Promise<{ token: string; expiresAt: string }>;
};

export function createAdminsRoutes(input: { module: AdminsModule; auth: AdminAuth }) {
    const app = new OpenAPIHono<ApiEnv>();
    const adminIdParamsSchema = z.object({ adminId: z.string() });

    app.use("*", input.auth.verify);

    app.openapi(
        defineRoute({
            method: "get",
            path: "/",
            tags: ["Admins"],
            summary: "List admins",
            middleware: [
                input.auth.requirePermissions(["admin.manage"]),
                parseQuery({
                    schema: listAdminsQuerySchema,
                    invalidCode: "invalid_query",
                    invalidMessage: "Admins query is invalid"
                }),
                useResponse(listAdminsResultSchema)
            ],
            request: { query: listAdminsQuerySchema },
            success: { schema: listAdminsResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<unknown, { limit: number; offset: number }>(({ query }) => input.module.list(query))
    );

    app.openapi(
        defineRoute({
            method: "patch",
            path: "/:adminId/status",
            tags: ["Admins"],
            summary: "Set admin status",
            middleware: [input.auth.requirePermissions(["admin.manage"]), parseBody(setAdminStatusSchema)],
            request: {
                params: adminIdParamsSchema,
                body: setAdminStatusSchema
            },
            success: { schema: okSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<SetAdminStatusDto, unknown, { adminId: string }>(async ({ c, body, params }) => {
            const actorId = c.get("admin")?.adminId;
            if (actorId) {
                await input.module.setStatus({
                    adminId: params.adminId,
                    status: body!.status,
                    actorId
                });
            } else {
                await input.module.setStatus({
                    adminId: params.adminId,
                    status: body!.status
                });
            }
            return { ok: true };
        })
    );

    app.openapi(
        defineRoute({
            method: "patch",
            path: "/:adminId/role",
            tags: ["Admins"],
            summary: "Set admin role",
            middleware: [input.auth.requirePermissions(["admin.manage"]), parseBody(setAdminRoleSchema)],
            request: {
                params: adminIdParamsSchema,
                body: setAdminRoleSchema
            },
            success: { schema: okSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<SetAdminRoleDto, unknown, { adminId: string }>(async ({ c, body, params }) => {
            const actorId = c.get("admin")?.adminId;
            if (actorId) {
                await input.module.setRole({
                    adminId: params.adminId,
                    roleId: body!.roleId,
                    actorId
                });
            } else {
                await input.module.setRole({
                    adminId: params.adminId,
                    roleId: body!.roleId
                });
            }
            return { ok: true };
        })
    );

    app.openapi(
        defineRoute({
            method: "post",
            path: "/:adminId/password-reset",
            tags: ["Admins"],
            summary: "Create admin password reset",
            middleware: [
                input.auth.requirePermissions(["admin.manage"]),
                parseBody(createAdminPasswordResetSchema),
                useResponse(createAdminPasswordResetResultSchema)
            ],
            request: {
                params: adminIdParamsSchema,
                body: createAdminPasswordResetSchema
            },
            success: { schema: createAdminPasswordResetResultSchema },
            security: [{ adminBearerAuth: [] }]
        }),
        handler<CreateAdminPasswordResetDto, unknown, { adminId: string }>(async ({ c, body, params }) => {
            const actorId = c.get("admin")?.adminId;
            if (actorId) {
                return input.module.createPasswordReset({
                    adminId: params.adminId,
                    expiresAt: new Date(Date.now() + body!.expiresInMs),
                    actorId
                });
            }
            return input.module.createPasswordReset({
                adminId: params.adminId,
                expiresAt: new Date(Date.now() + body!.expiresInMs)
            });
        })
    );

    return app;
}
