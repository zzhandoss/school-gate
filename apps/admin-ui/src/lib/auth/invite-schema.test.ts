import { describe, expect, it } from "vitest";

import { inviteRegistrationSchema } from "./invite-schema";

describe("inviteRegistrationSchema", () => {
    it("accepts valid invite registration payload", () => {
        const parsed = inviteRegistrationSchema.safeParse({
            email: "admin@example.com",
            password: "secret",
            confirmPassword: "secret",
            name: "Admin User"
        });

        expect(parsed.success).toBe(true);
    });

    it("rejects when passwords do not match", () => {
        const parsed = inviteRegistrationSchema.safeParse({
            email: "admin@example.com",
            password: "secret",
            confirmPassword: "different",
            name: ""
        });

        expect(parsed.success).toBe(false);
    });
});
