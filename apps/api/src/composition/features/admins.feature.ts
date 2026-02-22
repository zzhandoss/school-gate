import { adminAdminDtoSchema, type ListAdminsResultDto } from "@school-gate/contracts";
import type { AdminsModule } from "../../delivery/http/routes/admins.routes.js";
import type { ApiRuntime } from "../../runtime/createRuntime.js";
import type { createAuthFeature } from "./auth.feature.js";

type AuthFeature = ReturnType<typeof createAuthFeature>;

export function createAdminsFeature(runtime: ApiRuntime, auth: AuthFeature): AdminsModule {
    return {
        list: async ({ limit, offset }) => {
            const admins = await auth.adminsService.list({ limit, offset });
            const data: ListAdminsResultDto = {
                admins: admins.map((admin) =>
                    adminAdminDtoSchema.parse({
                        id: admin.id,
                        email: admin.email,
                        roleId: admin.roleId,
                        status: admin.status,
                        name: admin.name,
                        tgUserId: admin.tgUserId,
                        createdAt: admin.createdAt.toISOString(),
                        updatedAt: admin.updatedAt.toISOString()
                    })
                )
            };
            return data;
        },
        setStatus: ({ adminId, status, actorId }) =>
            auth.adminsService.setStatus({
                adminId,
                status,
                actorId,
                updatedAt: runtime.clock.now()
            }),
        setRole: ({ adminId, roleId, actorId }) => auth.setAdminRole({ adminId, roleId, changedByAdminId: actorId }),
        createPasswordReset: async (input) => {
            const result = await auth.createAdminPasswordResetLink({
                adminId: input.adminId,
                expiresAt: input.expiresAt,
                requestedByAdminId: input.actorId
            });
            return {
                token: result.token,
                expiresAt: result.expiresAt.toISOString()
            };
        }
    };
}
