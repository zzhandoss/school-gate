import { SignJWT } from "jose";
import type { JwtSigner, Permission } from "@school-gate/core";

export type AdminJwtInput = {
    adminId: string;
    roleId: string;
    permissions: Permission[];
};

function encodeSecret(secret: string) {
    return new TextEncoder().encode(secret);
}

function toEpochSeconds(date: Date) {
    return Math.floor(date.getTime() / 1000);
}

export async function signAdminJwt(input: {
    secret: string;
    ttlMs: number;
    payload: AdminJwtInput;
}): Promise<string> {
    const secret = encodeSecret(input.secret);
    const now = Math.floor(Date.now() / 1000);
    const exp = Math.floor((Date.now() + input.ttlMs) / 1000);

    return new SignJWT({ roleId: input.payload.roleId, permissions: input.payload.permissions })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt(now)
        .setExpirationTime(exp)
        .setSubject(input.payload.adminId)
        .sign(secret);
}

export function createAdminJwtSigner(secret: string): JwtSigner {
    const encoded = encodeSecret(secret);

    return {
        async signAdminAccessToken(input) {
            return new SignJWT({ roleId: input.payload.roleId, permissions: input.payload.permissions })
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt(toEpochSeconds(input.issuedAt))
                .setExpirationTime(toEpochSeconds(input.expiresAt))
                .setSubject(input.payload.adminId)
                .sign(encoded);
        }
    };
}
