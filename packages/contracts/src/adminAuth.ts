import { z } from "zod";

export const permissionSchema = z.enum([
    "admin.manage",
    "devices.read",
    "devices.write",
    "subscriptions.read",
    "subscriptions.review",
    "subscriptions.manage",
    "access_events.read",
    "access_events.map",
    "persons.read",
    "persons.write",
    "settings.read",
    "settings.write",
    "monitoring.read",
    "retention.manage"
]);

export const permissionsSchema = z.array(permissionSchema);

const positiveMs = z.coerce.number().int().positive();
const emailSchema = z.string().email();

export const adminLoginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1)
});

export const adminLoginResultSchema = z.object({
    token: z.string().min(1),
    expiresAt: z.string().datetime(),
    refreshToken: z.string().min(1),
    refreshExpiresAt: z.string().datetime(),
    admin: z.object({
        id: z.string().min(1),
        email: emailSchema,
        roleId: z.string().min(1),
        status: z.enum(["pending", "active", "disabled"]),
        name: z.string().min(1).nullable(),
        tgUserId: z.string().min(1).nullable()
    })
});

export const adminSessionResultSchema = z.object({
    admin: z.object({
        id: z.string().min(1),
        email: emailSchema,
        roleId: z.string().min(1),
        status: z.enum(["pending", "active", "disabled"]),
        name: z.string().min(1).nullable(),
        tgUserId: z.string().min(1).nullable()
    }),
    roleId: z.string().min(1),
    roleName: z.string().min(1),
    permissions: permissionsSchema
});

export const updateMyProfileSchema = z.object({
    email: emailSchema,
    name: z.preprocess(
        (value) => value === "" ? null : value,
        z.string().min(1).nullable().optional().default(null)
    )
});

export const updateMyProfileResultSchema = z.object({
    admin: z.object({
        id: z.string().min(1),
        email: emailSchema,
        roleId: z.string().min(1),
        status: z.enum(["pending", "active", "disabled"]),
        name: z.string().min(1).nullable(),
        tgUserId: z.string().min(1).nullable()
    })
});

export const changeMyPasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(1)
});

export const changeMyPasswordResultSchema = z.object({
    adminId: z.string().min(1)
});

export const adminRefreshSchema = z.object({
    refreshToken: z.string().min(1)
});

export const adminRefreshResultSchema = z.object({
    token: z.string().min(1),
    expiresAt: z.string().datetime(),
    refreshToken: z.string().min(1),
    refreshExpiresAt: z.string().datetime()
});

export const adminLogoutResultSchema = z.object({
    loggedOut: z.literal(true)
});

export const bootstrapFirstAdminSchema = z.object({
    email: emailSchema,
    password: z.string().min(1),
    name: z.string().min(1).nullable().optional().default(null)
});

export const bootstrapFirstAdminResultSchema = z.object({
    adminId: z.string().min(1),
    roleId: z.string().min(1)
});

const inviteBaseSchema = z.object({
    email: emailSchema.optional(),
    expiresInMs: positiveMs
});

const inviteByRoleIdSchema = inviteBaseSchema.extend({
    roleId: z.string().min(1)
});

const inviteByRoleNameSchema = inviteBaseSchema.extend({
    roleName: z.string().min(1),
    permissions: permissionsSchema.min(1)
});

export const createAdminInviteSchema = z.union([inviteByRoleIdSchema, inviteByRoleNameSchema]);

export const createAdminInviteResultSchema = z.object({
    token: z.string().min(1),
    roleId: z.string().min(1),
    email: emailSchema.nullable(),
    expiresAt: z.string().datetime()
});

export const acceptAdminInviteSchema = z.object({
    token: z.string().min(1),
    email: emailSchema,
    password: z.string().min(1),
    name: z.string().min(1).nullable().optional().default(null)
});

export const acceptAdminInviteResultSchema = z.object({
    adminId: z.string().min(1),
    roleId: z.string().min(1)
});

export const requestPasswordResetSchema = z.object({
    email: emailSchema,
    expiresInMs: positiveMs
});

export const requestPasswordResetResultSchema = z.object({
    token: z.string().min(1).nullable()
});

export const confirmPasswordResetSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(1)
});

export const confirmPasswordResetResultSchema = z.object({
    adminId: z.string().min(1)
});

export const createTelegramLinkCodeSchema = z.object({
    expiresInMs: positiveMs
});

export const createTelegramLinkCodeResultSchema = z.object({
    code: z.string().min(1),
    expiresAt: z.string().datetime()
});

export const requestTelegramLoginCodeSchema = z.object({
    email: emailSchema,
    expiresInMs: positiveMs.optional().default(5 * 60 * 1000)
});

export const requestTelegramLoginCodeResultSchema = z.object({
    sent: z.literal(true),
    expiresAt: z.string().datetime()
});

export const telegramOtpLoginSchema = z.object({
    email: emailSchema,
    code: z.string().regex(/^\d{6}$/)
});

export const telegramOtpLoginResultSchema = adminLoginResultSchema;

export const linkTelegramByCodeSchema = z.object({
    code: z.string().min(1),
    tgUserId: z.string().min(1)
});

export const linkTelegramByCodeResultSchema = z.object({
    adminId: z.string().min(1)
});

export const unlinkTelegramSchema = z.object({});

export const unlinkTelegramResultSchema = z.object({
    adminId: z.string().min(1)
});

export const createRoleSchema = z.object({
    name: z.string().min(1),
    permissions: permissionsSchema.min(1)
});

export const createRoleResultSchema = z.object({
    roleId: z.string().min(1)
});

export const updateRolePermissionsSchema = z.object({
    permissions: permissionsSchema.min(1)
});

export const updateRolePermissionsResultSchema = z.object({
    roleId: z.string().min(1)
});

export type PermissionDto = z.infer<typeof permissionSchema>;
export type PermissionsDto = z.infer<typeof permissionsSchema>;
export type AdminLoginDto = z.infer<typeof adminLoginSchema>;
export type AdminLoginResultDto = z.infer<typeof adminLoginResultSchema>;
export type AdminSessionResultDto = z.infer<typeof adminSessionResultSchema>;
export type UpdateMyProfileDto = z.infer<typeof updateMyProfileSchema>;
export type UpdateMyProfileResultDto = z.infer<typeof updateMyProfileResultSchema>;
export type ChangeMyPasswordDto = z.infer<typeof changeMyPasswordSchema>;
export type ChangeMyPasswordResultDto = z.infer<typeof changeMyPasswordResultSchema>;
export type AdminRefreshDto = z.infer<typeof adminRefreshSchema>;
export type AdminRefreshResultDto = z.infer<typeof adminRefreshResultSchema>;
export type AdminLogoutResultDto = z.infer<typeof adminLogoutResultSchema>;
export type BootstrapFirstAdminDto = z.infer<typeof bootstrapFirstAdminSchema>;
export type BootstrapFirstAdminResultDto = z.infer<typeof bootstrapFirstAdminResultSchema>;
export type CreateAdminInviteDto = z.infer<typeof createAdminInviteSchema>;
export type CreateAdminInviteResultDto = z.infer<typeof createAdminInviteResultSchema>;
export type AcceptAdminInviteDto = z.infer<typeof acceptAdminInviteSchema>;
export type AcceptAdminInviteResultDto = z.infer<typeof acceptAdminInviteResultSchema>;
export type RequestPasswordResetDto = z.infer<typeof requestPasswordResetSchema>;
export type RequestPasswordResetResultDto = z.infer<typeof requestPasswordResetResultSchema>;
export type ConfirmPasswordResetDto = z.infer<typeof confirmPasswordResetSchema>;
export type ConfirmPasswordResetResultDto = z.infer<typeof confirmPasswordResetResultSchema>;
export type CreateTelegramLinkCodeDto = z.infer<typeof createTelegramLinkCodeSchema>;
export type CreateTelegramLinkCodeResultDto = z.infer<typeof createTelegramLinkCodeResultSchema>;
export type RequestTelegramLoginCodeDto = z.infer<typeof requestTelegramLoginCodeSchema>;
export type RequestTelegramLoginCodeResultDto = z.infer<typeof requestTelegramLoginCodeResultSchema>;
export type TelegramOtpLoginDto = z.infer<typeof telegramOtpLoginSchema>;
export type TelegramOtpLoginResultDto = z.infer<typeof telegramOtpLoginResultSchema>;
export type LinkTelegramByCodeDto = z.infer<typeof linkTelegramByCodeSchema>;
export type LinkTelegramByCodeResultDto = z.infer<typeof linkTelegramByCodeResultSchema>;
export type UnlinkTelegramDto = z.infer<typeof unlinkTelegramSchema>;
export type UnlinkTelegramResultDto = z.infer<typeof unlinkTelegramResultSchema>;
export type CreateRoleDto = z.infer<typeof createRoleSchema>;
export type CreateRoleResultDto = z.infer<typeof createRoleResultSchema>;
export type UpdateRolePermissionsDto = z.infer<typeof updateRolePermissionsSchema>;
export type UpdateRolePermissionsResultDto = z.infer<typeof updateRolePermissionsResultSchema>;
