export type AdminStatus = "pending" | "active" | "disabled";

export type Admin = {
    id: string;
    email: string;
    passwordHash: string;
    roleId: string;
    status: AdminStatus;
    name: string | null;
    tgUserId: string | null;
    createdAt: Date;
    updatedAt: Date;
};
