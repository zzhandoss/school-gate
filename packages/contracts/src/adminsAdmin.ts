import { z } from "zod";

const emailSchema = z.string().email();
const positiveInt = z.number().int().positive();

export const listAdminsQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(200).default(50),
    offset: z.coerce.number().int().nonnegative().default(0),
});

export const adminStatusSchema = z.enum(["pending", "active", "disabled"]);

export const adminAdminDtoSchema = z.object({
    id: z.string().min(1),
    email: emailSchema,
    roleId: z.string().min(1),
    status: adminStatusSchema,
    name: z.string().min(1).nullable(),
    tgUserId: z.string().min(1).nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export const listAdminsResultSchema = z.object({
    admins: z.array(adminAdminDtoSchema),
});

export const setAdminStatusSchema = z.object({
    status: z.enum(["active", "disabled"]),
});

export const setAdminRoleSchema = z.object({
    roleId: z.string().min(1),
});

export const createAdminPasswordResetSchema = z.object({
    expiresInMs: positiveInt,
});

export const createAdminPasswordResetResultSchema = z.object({
    token: z.string().min(1),
    expiresAt: z.string().datetime(),
});

export type ListAdminsQueryDto = z.infer<typeof listAdminsQuerySchema>;
export type AdminAdminDto = z.infer<typeof adminAdminDtoSchema>;
export type ListAdminsResultDto = z.infer<typeof listAdminsResultSchema>;
export type SetAdminStatusDto = z.infer<typeof setAdminStatusSchema>;
export type SetAdminRoleDto = z.infer<typeof setAdminRoleSchema>;
export type CreateAdminPasswordResetDto = z.infer<typeof createAdminPasswordResetSchema>;
export type CreateAdminPasswordResetResultDto = z.infer<typeof createAdminPasswordResetResultSchema>;
