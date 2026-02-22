export type AdminAccessView = {
    adminId: string;
    email: string;
    name: string | null;
    roleId: string;
};

export type AdminBotService = {
    getAccess(input: { tgUserId: string }): Promise<AdminAccessView | null>;
    linkTelegramByCode(input: { tgUserId: string; code: string }): Promise<{ adminId: string }>;
};
