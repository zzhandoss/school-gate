import { describe, expect, it } from "vitest";
import { createBotApp } from "../../../apps/bot/src/app.js";

describe("Bot API", () => {
    it("GET /api/health требует авторизацию", async () => {
        const app = createBotApp({
            config: { internalToken: "secret" },
            telegram: { sendMessage: async () => {} }
        });

        const res = await app.request("/api/health");
        expect(res.status).toBe(401);
    });

    it("POST /api/notification/send отправляет сообщение", async () => {
        let called = false;
        const app = createBotApp({
            config: { internalToken: "secret" },
            telegram: {
                sendMessage: async () => {
                    called = true;
                }
            }
        });

        const res = await app.request("/api/notification/send", {
            method: "POST",
            headers: {
                authorization: "Bearer secret",
                "content-type": "application/json"
            },
            body: JSON.stringify({ tgUserId: "123", text: "hello" })
        });

        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(called).toBe(true);
    });
});

