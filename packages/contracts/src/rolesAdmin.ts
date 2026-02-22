import { z } from "zod";

export const adminRoleSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export const listAdminRolesResultSchema = z.object({
    roles: z.array(adminRoleSchema),
});

export const listAdminRolePermissionsResultSchema = z.object({
    roleId: z.string().min(1),
    permissions: z.array(z.string().min(1)),
});

export const listAdminPermissionsResultSchema = z.object({
    permissions: z.array(z.string().min(1)),
});

export type AdminRoleDto = z.infer<typeof adminRoleSchema>;
export type ListAdminRolesResultDto = z.infer<typeof listAdminRolesResultSchema>;
export type ListAdminRolePermissionsResultDto = z.infer<typeof listAdminRolePermissionsResultSchema>;
export type ListAdminPermissionsResultDto = z.infer<typeof listAdminPermissionsResultSchema>;
