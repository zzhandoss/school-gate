import { Hono } from "hono";
import { ZodError } from "zod";
import { parseJson } from "./parseJson.js";
import { fail, ok, unauthorized } from "./response.js";
import { sendNotificationSchema, type SendNotificationInput } from "./contracts.js";
import type { TelegramClient } from "./telegramClient.js";

export type BotAppConfig = {
    internalToken: string;
};

export type BotAppInput = {
    config: BotAppConfig;
    telegram: TelegramClient;
};

function checkAuth(authHeader: string | undefined, token: string): boolean {
    const header = authHeader ?? "";
    const [type, value] = header.split(" ");
    if (type !== "Bearer") return false;
    return value === token;
}

export function createBotApp(input: BotAppInput) {
    const app = new Hono();

    app.get("/api/health", (c) => {
        if (!checkAuth(c.req.header("authorization"), input.config.internalToken)) {
            return unauthorized(c);
        }
        return ok(c, { ok: true });
    });

    app.post("/api/notification/send", async (c) => {
        if (!checkAuth(c.req.header("authorization"), input.config.internalToken)) {
            return unauthorized(c);
        }

        const parsed = await parseJson<SendNotificationInput>(c, sendNotificationSchema, "Invalid payload");
        if (!parsed.ok) return parsed.response;

        await input.telegram.sendMessage({ tgUserId: parsed.data.tgUserId, text: parsed.data.text });
        return ok(c, { sent: true });
    });

    app.notFound((c) => fail(c, { status: 404, code: "not_found", message: "Not found" }));

    app.onError((err, c) => {
        if (err instanceof ZodError) {
            return fail(c, { status: 500, code: "internal_error", message: "Internal validation error" });
        }
        return fail(c, { status: 500, code: "internal_error", message: "Unhandled server error" });
    });

    return app;
}
