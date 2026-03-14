import { describe, expect, it } from "vitest";

import { buildApiUrl, requireApiBaseUrl, resolveApiBaseUrlFromRequest } from "./base-url";

describe("buildApiUrl", () => {
    it("uses configured absolute base URL when provided", () => {
        expect(buildApiUrl("/api/auth/session", "https://school.example.com/")).toBe(
            "https://school.example.com/api/auth/session"
        );
        expect(buildApiUrl("api/auth/session", "https://school.example.com")).toBe(
            "https://school.example.com/api/auth/session"
        );
        expect(buildApiUrl("/api/auth/session", "https://school.example.com/api")).toBe(
            "https://school.example.com/api/auth/session"
        );
    });

    it("supports relative /api base URL without double prefix", () => {
        expect(buildApiUrl("/api/auth/session", "/api")).toBe("/api/auth/session");
        expect(buildApiUrl("auth/session", "/api")).toBe("/api/auth/session");
    });

    it("keeps absolute request URLs unchanged", () => {
        expect(buildApiUrl("https://school.example.com/api/auth/session", "https://ignored.example.com")).toBe(
            "https://school.example.com/api/auth/session"
        );
    });
});

describe("requireApiBaseUrl", () => {
    it("returns normalized base URL", () => {
        expect(requireApiBaseUrl("https://api.school.example.com/")).toBe("https://api.school.example.com");
    });

    it("throws when base URL is missing", () => {
        expect(() => requireApiBaseUrl()).toThrow("Missing VITE_API_BASE_URL");
        expect(() => requireApiBaseUrl("")).toThrow("Missing VITE_API_BASE_URL");
        expect(() => requireApiBaseUrl("   ")).toThrow("Missing VITE_API_BASE_URL");
    });

    it("trims surrounding spaces", () => {
        expect(requireApiBaseUrl("  https://api.school.example.com/v1/  ")).toBe(
            "https://api.school.example.com/v1"
        );
    });
});

describe("resolveApiBaseUrlFromRequest", () => {
    it("returns absolute base URL unchanged", () => {
        expect(
            resolveApiBaseUrlFromRequest({
                apiBaseUrl: "https://api.school.example.com"
            })
        ).toBe("https://api.school.example.com");
    });

    it("resolves relative base URL from forwarded headers", () => {
        expect(
            resolveApiBaseUrlFromRequest({
                apiBaseUrl: "/api",
                forwardedProto: "https, http",
                forwardedHost: "school.example.com, internal.school.example.com",
                host: "localhost:5000"
            })
        ).toBe("https://school.example.com/api");
    });

    it("resolves relative base URL from origin header", () => {
        expect(
            resolveApiBaseUrlFromRequest({
                apiBaseUrl: "/api",
                origin: "https://school.example.com"
            })
        ).toBe("https://school.example.com/api");
    });

    it("throws when relative base URL cannot resolve request origin", () => {
        expect(() =>
            resolveApiBaseUrlFromRequest({
                apiBaseUrl: "/api"
            })
        ).toThrow("Cannot resolve API origin from request headers");
    });
});
