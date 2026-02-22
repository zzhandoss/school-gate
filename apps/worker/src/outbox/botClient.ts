export type BotClient = {
    isHealthy(): Promise<boolean>;
    sendNotification(input: { tgUserId: string; text: string }): Promise<void>;
};

export type BotHttpClientConfig = {
    baseUrl: string;
    token: string;
    timeoutMs?: number;
};

function buildUrl(baseUrl: string, path: string): string {
    return new URL(path, baseUrl).toString();
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(input, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
}

export function createBotHttpClient(config: BotHttpClientConfig): BotClient {
    const timeoutMs = config.timeoutMs ?? 5_000;
    const authHeader = { authorization: `Bearer ${config.token}` };
    const healthUrl = buildUrl(config.baseUrl, "/api/health");
    const sendUrl = buildUrl(config.baseUrl, "/api/notification/send");

    return {
        isHealthy: async () => {
            try {
                const res = await fetchWithTimeout(healthUrl, { headers: authHeader }, timeoutMs);
                return res.ok;
            } catch {
                return false;
            }
        },
        sendNotification: async (input) => {
            const res = await fetchWithTimeout(
                sendUrl,
                {
                    method: "POST",
                    headers: {
                        ...authHeader,
                        "content-type": "application/json"
                    },
                    body: JSON.stringify({
                        tgUserId: input.tgUserId,
                        text: input.text
                    })
                },
                timeoutMs
            );

            if (!res.ok) {
                throw new Error(`Bot send failed: ${res.status} ${res.statusText}`);
            }
        }
    };
}
