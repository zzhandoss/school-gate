import { describe, expect, it } from "vitest";

import { buildApiUrl, resolveApiBaseUrlFromRequest } from "./base-url";

describe("buildApiUrl", () => {
    it("uses relative API paths when base URL is not configured", () => {
        expect(buildApiUrl("/api/auth/session")).toBe("/api/auth/session");
        expect(buildApiUrl("api/auth/session")).toBe("/api/auth/session");
    });

    it("uses configured absolute base URL when provided", () => {
        expect(buildApiUrl("/api/auth/session", "https://school.example.com/")).toBe(
            "https://school.example.com/api/auth/session"
        );
    });

    it("keeps absolute request URLs unchanged", () => {
        expect(buildApiUrl("https://school.example.com/api/auth/session", "https://ignored.example.com")).toBe(
            "https://school.example.com/api/auth/session"
        );
    });
});

describe("resolveApiBaseUrlFromRequest", () => {
    it("prefers explicit environment base URL", () => {
        expect(
            resolveApiBaseUrlFromRequest({
                apiBaseUrl: "https://api.school.example.com/"
            })
        ).toBe("https://api.school.example.com");
    });

    it("uses origin header when available", () => {
        expect(
            resolveApiBaseUrlFromRequest({
                origin: "https://school.example.com"
            })
        ).toBe("https://school.example.com");
    });

    it("uses forwarded headers before host", () => {
        expect(
            resolveApiBaseUrlFromRequest({
                forwardedProto: "https, http",
                forwardedHost: "school.example.com, internal.school.example.com",
                host: "localhost:5000"
            })
        ).toBe("https://school.example.com");
    });

    it("falls back to host with http when protocol header is absent", () => {
        expect(
            resolveApiBaseUrlFromRequest({
                host: "school.example.com"
            })
        ).toBe("http://school.example.com");
    });
});
