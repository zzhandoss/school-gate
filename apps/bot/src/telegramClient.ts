export type TelegramClient = {
    sendMessage(input: { tgUserId: string; text: string }): Promise<void>;
};

export function createTelegramClient(token: string): TelegramClient {
    const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;

    return {
        sendMessage: async ({ tgUserId, text }) => {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ chat_id: tgUserId, text })
            });

            if (!res.ok) {
                throw new Error(`Telegram sendMessage failed: ${res.status} ${res.statusText}`);
            }

            const json = (await res.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
            if (json && json.ok === false) {
                throw new Error(`Telegram sendMessage error: ${json.description ?? "unknown error"}`);
            }
        }
    };
}
