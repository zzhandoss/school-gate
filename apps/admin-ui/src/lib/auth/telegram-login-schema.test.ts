import { describe, expect, it } from "vitest";

import {
    requestTelegramLoginCodeSchema,
    telegramOtpLoginSchema
} from "./telegram-login-schema";

describe("telegram login schemas", () => {
    it("accepts valid email for telegram code request", () => {
        const parsed = requestTelegramLoginCodeSchema.safeParse({
            email: "admin@example.com"
        });

        expect(parsed.success).toBe(true);
    });

    it("rejects invalid otp code format", () => {
        const parsed = telegramOtpLoginSchema.safeParse({
            email: "admin@example.com",
            code: "12ab"
        });

        expect(parsed.success).toBe(false);
    });
});
