import type http from "node:http";

export async function readJson(req: http.IncomingMessage) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const raw = Buffer.concat(chunks).toString("utf8");
    if (!raw) return null;
    return JSON.parse(raw);
}

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
    res.writeHead(status, {
        "content-type": "application/json"
    });
    res.end(JSON.stringify(body));
}

export function ok(res: http.ServerResponse, body: unknown) {
    sendJson(res, 200, body);
}

export function fail(res: http.ServerResponse, status: number, message: string) {
    sendJson(res, status, { error: message });
}

export function unauthorized(res: http.ServerResponse) {
    fail(res, 401, "Unauthorized");
}