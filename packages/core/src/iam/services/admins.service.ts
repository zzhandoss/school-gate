import { enqueueAuditRequested } from "../../audit/events/auditRequested.js";
import { AdminDisabledError, AdminEmailAlreadyExistsError, AdminNotFoundError } from "../../utils/errors.js";
import { normalizeEmail } from "../../utils/index.js";
import type { AdminsService, AdminsServiceDeps } from "./admins.types.js";

export function createAdminsService(deps: AdminsServiceDeps): AdminsService {
    return {
        withTx(tx: unknown) {
            return createAdminsService({
                ...deps,
                adminsRepo: deps.adminsRepo.withTx(tx),
            });
        },


        async create(input) {
            await deps.adminsRepo.create({
                id: input.id,
                email: input.email,
                passwordHash: input.passwordHash,
                roleId: input.roleId,
                status: input.status,
                name: input.name ?? null,
                tgUserId: input.tgUserId ?? null,
                createdAt: input.createdAt,
                updatedAt: input.updatedAt,
            });
        },
        getById(id) {
            return deps.adminsRepo.getById(id);
        },
        getByEmail(email) {
            return deps.adminsRepo.getByEmail(email);
        },
        getByTgUserId(tgUserId) {
            return deps.adminsRepo.getByTgUserId(tgUserId);
        },
        list(input) {
            return deps.adminsRepo.list({ limit: input.limit, offset: input.offset });
        },
        async setStatus(input) {
            const updated = await deps.adminsRepo.setStatus({
                id: input.adminId,
                status: input.status,
                updatedAt: input.updatedAt,
            });
            if (!updated) {
                throw new AdminNotFoundError();
            }
            if (deps.outbox && deps.idGen) {
                enqueueAuditRequested({
                    outbox: deps.outbox,
                    id: deps.idGen.nextId(),
                    actorId: input.actorId ?? "system:admin_status",
                    action: "admin_status_set",
                    entityType: "admin",
                    entityId: input.adminId,
                    at: input.updatedAt,
                    meta: { status: input.status },
                });
            }
        },
        async setRole(input) {
            const updated = await deps.adminsRepo.setRole({
                id: input.adminId,
                roleId: input.roleId,
                updatedAt: input.updatedAt,
            });
            if (!updated) {
                throw new AdminNotFoundError();
            }
            if (deps.outbox && deps.idGen) {
                enqueueAuditRequested({
                    outbox: deps.outbox,
                    id: deps.idGen.nextId(),
                    actorId: input.actorId ?? "system:admin_role",
                    action: "admin_role_set",
                    entityType: "admin",
                    entityId: input.adminId,
                    at: input.updatedAt,
                    meta: { roleId: input.roleId },
                });
            }
        },
        async setPassword(input) {
            const updated = await deps.adminsRepo.setPassword({
                id: input.adminId,
                passwordHash: input.passwordHash,
                updatedAt: input.updatedAt,
            });
            if (!updated) {
                throw new AdminNotFoundError();
            }
            if (deps.outbox && deps.idGen) {
                enqueueAuditRequested({
                    outbox: deps.outbox,
                    id: deps.idGen.nextId(),
                    actorId: input.actorId ?? `admin:${input.adminId}`,
                    action: "admin_password_set",
                    entityType: "admin",
                    entityId: input.adminId,
                    at: input.updatedAt,
                });
            }
        },
        async setProfile(input) {
            const email = normalizeEmail(input.email);
            const existing = await deps.adminsRepo.getByEmail(email);
            if (existing && existing.id !== input.adminId) {
                throw new AdminEmailAlreadyExistsError();
            }
            const updated = await deps.adminsRepo.setProfile({
                id: input.adminId,
                email,
                name: input.name,
                updatedAt: input.updatedAt,
            });
            if (!updated) {
                throw new AdminNotFoundError();
            }
            if (deps.outbox && deps.idGen) {
                enqueueAuditRequested({
                    outbox: deps.outbox,
                    id: deps.idGen.nextId(),
                    actorId: input.actorId ?? `admin:${input.adminId}`,
                    action: "admin_profile_updated",
                    entityType: "admin",
                    entityId: input.adminId,
                    at: input.updatedAt,
                    meta: { email, hasName: input.name !== null },
                });
            }
        },
        async setTgUserId(input) {
            const updated = await deps.adminsRepo.setTgUserId({
                id: input.adminId,
                tgUserId: input.tgUserId,
                updatedAt: input.updatedAt,
            });
            if (!updated) {
                throw new AdminNotFoundError();
            }
            if (deps.outbox && deps.idGen) {
                enqueueAuditRequested({
                    outbox: deps.outbox,
                    id: deps.idGen.nextId(),
                    actorId: input.actorId ?? `admin:${input.adminId}`,
                    action: "admin_telegram_updated",
                    entityType: "admin",
                    entityId: input.adminId,
                    at: input.updatedAt,
                    meta: { tgUserId: input.tgUserId },
                });
            }
        },
        async login(input) {
            const email = normalizeEmail(input.email);
            const admin = await deps.adminsRepo.getByEmail(email);

            if (!admin) {
                await deps.passwordHasher.verify(deps.passwordHasher.dummyHash, input.password);
                return null;
            }

            const isValid = await deps.passwordHasher.verify(admin.passwordHash, input.password);
            if (!isValid) {
                return null;
            }

            if (admin.status !== "active") {
                throw new AdminDisabledError();
            }

            return { admin };
        },
    };
}