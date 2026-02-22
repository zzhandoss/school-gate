import { describe, expect, it } from "vitest";
import { parseLinkCodeCommand } from "../../../apps/bot/src/telegram/commands.js";
import { createMainMenuKeyboard, menuButtons } from "../../../apps/bot/src/telegram/keyboards.js";

describe("telegram commands and menu", () => {
    it("parses /link code", () => {
        expect(parseLinkCodeCommand("/link abc123")).toBe("abc123");
        expect(parseLinkCodeCommand("/link@SchoolGateBot abc123")).toBe("abc123");
        expect(parseLinkCodeCommand("/link abc123 extra")).toBe("abc123");
    });

    it("handles invalid or empty /link payload", () => {
        expect(parseLinkCodeCommand("/link")).toBe("");
        expect(parseLinkCodeCommand("hello")).toBeNull();
    });

    it("builds keyboard for parent and admin modes", () => {
        const parentKeyboard = createMainMenuKeyboard({ mode: "parent", hasAdminAccess: true });
        const adminKeyboard = createMainMenuKeyboard({ mode: "admin", hasAdminAccess: true });
        const parentButtons = (parentKeyboard.reply_markup as { keyboard: string[][] }).keyboard.flat();
        const adminButtons = (adminKeyboard.reply_markup as { keyboard: string[][] }).keyboard.flat();

        expect(parentButtons).toContain(menuButtons.newRequest);
        expect(parentButtons).toContain(menuButtons.switchToAdmin);
        expect(adminButtons).toContain(menuButtons.adminMenu);
        expect(adminButtons).toContain(menuButtons.switchToParent);
    });
});
