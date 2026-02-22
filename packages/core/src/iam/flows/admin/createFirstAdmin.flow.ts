import { enqueueAuditRequested } from "../../../audit/events/auditRequested.js";
import { getRolePreset } from "../../constants/rolePresets.js";
import { FirstAdminAlreadyExistsError } from "../../../utils/errors.js";
import { normalizeEmail } from "../../../utils/normalizeEmail.js";
import type { CreateFirstAdminDeps, CreateFirstAdminFlow } from "./createFirstAdmin.types.js";

const SUPER_ADMIN_ROLE_NAME = "super_admin";

export function createCreateFirstAdminFlow(deps: CreateFirstAdminDeps): CreateFirstAdminFlow {
    return async function createFirstAdmin(input) {
        const existingAdmins = await deps.adminsService.list({ limit: 1, offset: 0 });
        if (existingAdmins.length > 0) {
            throw new FirstAdminAlreadyExistsError();
        }

        const email = normalizeEmail(input.email);
        const preset = getRolePreset(SUPER_ADMIN_ROLE_NAME);
        if (!preset) {
            throw new Error("super_admin_preset_not_found");
        }

        const now = deps.clock.now();
        const existingRole = await deps.rolesService.getByName(SUPER_ADMIN_ROLE_NAME);
        const roleId = existingRole?.id ?? deps.idGen.nextId();

        if (!existingRole) {
            await deps.rolesService.createRole({
                id: roleId,
                name: SUPER_ADMIN_ROLE_NAME,
                permissions: preset.permissions
            });
        }

        const adminId = deps.idGen.nextId();
        const passwordHash = await deps.passwordHasher.hash(input.password);

        await deps.adminsService.create({
            id: adminId,
            email,
            passwordHash,
            roleId,
            status: "active",
            name: input.name ?? null,
            tgUserId: null,
            createdAt: now,
            updatedAt: now
        });

        enqueueAuditRequested({
            outbox: deps.outbox,
            id: deps.idGen.nextId(),
            actorId: "system:first_admin_bootstrap",
            action: "first_admin_created",
            entityType: "admin",
            entityId: adminId,
            at: now,
            meta: { roleId, email }
        });

        return { adminId, roleId };
    };
}