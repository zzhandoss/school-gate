import crypto from "node:crypto";
import type {
    CoreAccessEventBatchResult,
    CoreAccessEventIngestInput,
    CoreAccessEventIngestResult,
    CoreIngestClient
} from "@school-gate/device/core/ports/coreIngestClient";

export class CoreIngestHttpError extends Error {
    readonly status: number;
    readonly retriable: boolean;

    constructor(input: { status: number; message: string; retriable: boolean }) {
        super(input.message);
        this.status = input.status;
        this.retriable = input.retriable;
    }
}

type CoreIngestHttpClientConfig = {
    baseUrl: string;
    token: string;
    hmacSecret: string;
    timeoutMs: number;
    fetchImpl?: typeof fetch;
};

function withTimeout<T>(timeoutMs: number, cb: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return cb(controller.signal).finally(() => clearTimeout(timer));
}

function isRetriableStatus(status: number): boolean {
    return status >= 500 || status === 408 || status === 429;
}

async function parseJsonSafe<T>(response: Response): Promise<T | null> {
    try {
        return (await response.json()) as T;
    } catch {
        return null;
    }
}

function extractErrorMessage(json: unknown, status: number): string {
    if (!json || typeof json !== "object") {
        return `Core ingest failed with status ${status}`;
    }

    const anyJson = json as any;
    if (anyJson.success === false && anyJson.error?.message) {
        return String(anyJson.error.message);
    }
    if (typeof anyJson.error === "string") {
        return anyJson.error;
    }
    if (anyJson.error?.message) {
        return String(anyJson.error.message);
    }

    return `Core ingest failed with status ${status}`;
}

export function createCoreIngestHttpClient(config: CoreIngestHttpClientConfig): CoreIngestClient {
    const fetchImpl = config.fetchImpl ?? fetch;
    const baseUrl = config.baseUrl.replace(/\/+$/, "");

    async function send<TInput, TResult>(path: string, body: TInput): Promise<TResult> {
        return withTimeout(config.timeoutMs, async (signal) => {
            const rawBody = JSON.stringify(body);
            const timestamp = Date.now();
            const signature = crypto
                .createHmac("sha256", config.hmacSecret)
                .update(`${timestamp}.${rawBody}`)
                .digest("hex");
            const response = await fetchImpl(`${baseUrl}${path}`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    authorization: `Bearer ${config.token}`,
                    "x-timestamp": String(timestamp),
                    "x-signature": signature
                },
                body: rawBody,
                signal
            });

            if (!response.ok) {
                const json = await parseJsonSafe<unknown>(response);
                const message = extractErrorMessage(json, response.status);
                throw new CoreIngestHttpError({
                    status: response.status,
                    message,
                    retriable: isRetriableStatus(response.status)
                });
            }

            const json = await parseJsonSafe<TResult>(response);
            if (!json) {
                throw new CoreIngestHttpError({
                    status: response.status,
                    message: "Core ingest returned empty JSON response",
                    retriable: true
                });
            }

            return json;
        });
    }

    return {
        sendEvent(input: CoreAccessEventIngestInput): Promise<CoreAccessEventIngestResult> {
            return send<CoreAccessEventIngestInput, CoreAccessEventIngestResult>("/api/events", input);
        },
        sendBatch(input: { events: CoreAccessEventIngestInput[] }): Promise<CoreAccessEventBatchResult> {
            return send<{ events: CoreAccessEventIngestInput[] }, CoreAccessEventBatchResult>(
                "/api/events/batch",
                input
            );
        }
    };
}
