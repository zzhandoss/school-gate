import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { ApiEnv } from "../context.js";

export type AuthCookieConfig = {
    accessCookieName: string;
    refreshCookieName: string;
    path: string;
    secure: boolean;
    sameSite: "strict" | "lax" | "none";
};

export function getAccessCookie(c: Context<ApiEnv>, config: AuthCookieConfig) {
    return getCookie(c, config.accessCookieName) ?? null;
}

export function getRefreshCookie(c: Context<ApiEnv>, config: AuthCookieConfig) {
    return getCookie(c, config.refreshCookieName) ?? null;
}

export function setAuthCookies(
    c: Context<ApiEnv>,
    config: AuthCookieConfig,
    input: { accessToken: string; refreshToken: string; accessMaxAgeSec: number; refreshMaxAgeSec: number }
) {
    setCookie(c, config.accessCookieName, input.accessToken, {
        httpOnly: true,
        secure: config.secure,
        sameSite: config.sameSite,
        path: config.path,
        maxAge: input.accessMaxAgeSec
    });
    setCookie(c, config.refreshCookieName, input.refreshToken, {
        httpOnly: true,
        secure: config.secure,
        sameSite: config.sameSite,
        path: config.path,
        maxAge: input.refreshMaxAgeSec
    });
}

export function clearAuthCookies(c: Context<ApiEnv>, config: AuthCookieConfig) {
    deleteCookie(c, config.accessCookieName, {
        httpOnly: true,
        secure: config.secure,
        sameSite: config.sameSite,
        path: config.path
    });
    deleteCookie(c, config.refreshCookieName, {
        httpOnly: true,
        secure: config.secure,
        sameSite: config.sameSite,
        path: config.path
    });
}
