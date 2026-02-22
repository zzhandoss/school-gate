import { describe, expect, it } from "vitest";
import {
    formatSubscriptionToggleCallbackData,
    parseSubscriptionToggleCallbackData
} from "../../../apps/bot/src/telegram/callbacks.js";

describe("telegram callback data", () => {
    it("formats and parses toggle callback data", () => {
        const data = formatSubscriptionToggleCallbackData({
            subscriptionId: "sub-1",
            isActive: true
        });
        expect(data).toBe("sub:on:sub-1");

        const parsed = parseSubscriptionToggleCallbackData(data);
        expect(parsed).toEqual({
            subscriptionId: "sub-1",
            isActive: true
        });
    });

    it("returns null for invalid payload", () => {
        expect(parseSubscriptionToggleCallbackData("bad:data")).toBeNull();
    });
});
