import { describe, expect, it } from "vitest";

import { parseEnvelope } from "./envelope";
import { ApiError } from "./types";

describe("parseEnvelope", () => {
    it("returns data for success envelopes", () => {
        const payload = {
            success: true,
            data: { ok: true }
        };

        const parsed = parseEnvelope(200, payload);
        expect(parsed).toEqual({ ok: true });
    });

    it("throws ApiError for fail envelopes", () => {
        const payload = {
            success: false,
            error: {
                code: "forbidden",
                message: "Forbidden"
            }
        };

        expect(() => parseEnvelope(403, payload)).toThrowError(ApiError);
        expect(() => parseEnvelope(403, payload)).toThrowError("Forbidden");
    });

    it("throws invalid_response for broken payload", () => {
        expect(() => parseEnvelope(500, { hello: "world" })).toThrowError(ApiError);
        try {
            parseEnvelope(500, { hello: "world" });
        } catch (value) {
            const error = value as ApiError;
            expect(error.code).toBe("invalid_response");
        }
    });
});
