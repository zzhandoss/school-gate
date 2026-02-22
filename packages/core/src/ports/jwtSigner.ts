import type { Permission } from "../iam/index.js";

export type AdminAccessTokenPayload = {
    adminId: string;
    roleId: string;
    permissions: Permission[];
};

export interface JwtSigner {
    signAdminAccessToken(input: {
        payload: AdminAccessTokenPayload;
        issuedAt: Date;
        expiresAt: Date;
    }): Promise<string>;
}
