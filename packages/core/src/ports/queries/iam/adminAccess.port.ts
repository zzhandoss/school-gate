import type { AdminAccess } from "../../../iam/index.js";

export type AdminAccessQueryPort = {
    getAdminAccess(adminId: string): Promise<AdminAccess>;
};
