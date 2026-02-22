import http from "node:http";
import { URL } from "node:url";
import { z } from "zod";
import type { createAdapterEventsRepo } from "./eventsRepo.js";
import { fail, ok, readJson, unauthorized } from "./http.js";

const backfillSchema = z.object({
    deviceId: z.string().min(1),
    sinceEventId: z.string().min(1).nullable().optional(),
    limit: z.number().int().positive()
});

export type AdapterServer = {
    listen: (port: number, cb?: () => void) => void;
    close: () => void;
};

type AdapterServerDeps = {
    token: string;
    eventsRepo: ReturnType<typeof createAdapterEventsRepo>;
};

function checkAuth(req: http.IncomingMessage, token: string): boolean {
    const header = req.headers.authorization ?? "";
    const [type, value] = header.split(" ");
    if (type !== "Bearer") return false;
    return value === token;
}

export function createAdapterServer(deps: AdapterServerDeps): AdapterServer {
    const server = http.createServer(async (req, res) => {
        try {
            const url = new URL(req.url ?? "/", "http://localhost");
            if (req.method === "GET" && url.pathname === "/health") {
                return ok(res, { ok: true });
            }
            if (req.method === "POST" && url.pathname === "/events/backfill") {
                if (!checkAuth(req, deps.token)) {
                    return unauthorized(res);
                }
                const raw = await readJson(req);
                const parsed = backfillSchema.safeParse(raw);
                if (!parsed.success) {
                    return fail(res, 400, "Invalid backfill payload");
                }

                const events = deps.eventsRepo
                    .listBackfill(parsed.data.deviceId, parsed.data.sinceEventId ?? null, parsed.data.limit)
                    .map((event) => ({
                        deviceId: event.deviceId,
                        eventId: event.eventId,
                        direction: event.direction,
                        occurredAt: event.occurredAt,
                        terminalPersonId: event.terminalPersonId ?? null,
                        rawPayload: event.rawPayload ?? null
                    }));

                return ok(res, { events });
            }

            return fail(res, 404, "Not found");
        } catch (err: any) {
            return fail(res, 500, String(err?.message ?? err));
        }
    });

    return {
        listen: (port, cb) => server.listen(port, cb),
        close: () => server.close()
    };
}