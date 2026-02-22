import { describe, expect, it } from "vitest";

import {
    confirmPasswordResetSchema,
    requestPasswordResetSchema
} from "./password-reset-schema";

describe("password reset schemas", () => {
    it("validates request payload", () => {
        const parsed = requestPasswordResetSchema.safeParse({
            email: "admin@example.com"
        });
        expect(parsed.success).toBe(true);
    });

    it("validates confirm payload password match", () => {
        const parsed = confirmPasswordResetSchema.safeParse({
            password: "secret",
            confirmPassword: "different"
        });
        expect(parsed.success).toBe(false);
    });
});
