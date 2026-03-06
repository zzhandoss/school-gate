import http from "node:http";
import { URL } from "node:url";
import { z } from "zod";
import type { createAdapterEventsRepo } from "./eventsRepo.js";
import type { PeopleCatalog } from "./peopleCatalog.js";
import { fail, ok, readJson, unauthorized } from "./http.js";

const backfillSchema = z.object({
    deviceId: z.string().min(1),
    sinceEventId: z.string().min(1).nullable().optional(),
    limit: z.number().int().positive()
});

const exportTargetSchema = z.discriminatedUnion("mode", [
    z.object({
        mode: z.literal("device"),
        deviceId: z.string().min(1)
    }),
    z.object({
        mode: z.literal("devices"),
        deviceIds: z.array(z.string().min(1)).min(1)
    }),
    z.object({
        mode: z.literal("allAssigned")
    })
]);

const exportUsersSchema = z.object({
    target: exportTargetSchema,
    view: z.enum(["flat", "grouped"]).default("grouped"),
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
    includeCards: z.boolean().default(true)
});

const writeUsersSchema = z.object({
    target: exportTargetSchema,
    person: z.object({
        userId: z.string().min(1),
        displayName: z.string().min(1)
    })
});

const bulkWriteUsersSchema = z.object({
    target: exportTargetSchema,
    persons: z.array(
        z.object({
            userId: z.string().min(1),
            displayName: z.string().min(1)
        })
    ).min(1)
});

export type AdapterServer = {
    listen: (port: number, cb?: () => void) => void;
    close: () => void;
};

type AdapterServerDeps = {
    token: string;
    eventsRepo: ReturnType<typeof createAdapterEventsRepo>;
    peopleCatalog: PeopleCatalog;
};

function checkAuth(req: http.IncomingMessage, token: string): boolean {
    const header = req.headers.authorization ?? "";
    const [type, value] = header.split(" ");
    if (type !== "Bearer") return false;
    return value === token;
}

export function createAdapterServer(deps: AdapterServerDeps): AdapterServer {
    const catalogPeople = deps.peopleCatalog.pickRandomPeople(20).filter((person, index, array) => {
        return array.findIndex((item) => item.code === person.code) === index;
    }).filter((person) => !person.random);

    function buildExportUsers(deviceId: string) {
        return catalogPeople.map((person, index) => {
            const personIndex = index + 1;
            return {
                deviceId,
                terminalPersonId: deps.peopleCatalog.resolveTerminalPersonId(person),
                displayName: person.fullName,
                userType: "0",
                userStatus: "0",
                authority: "2",
                citizenIdNo: `900101${String(personIndex).padStart(6, "0")}`,
                validFrom: null,
                validTo: null,
                cardNo: `CARD-${String(personIndex).padStart(6, "0")}`,
                cardName: "Main card",
                sourceSummary: ["accessUser", "accessCard"],
                rawUserPayload: JSON.stringify({ UserID: deps.peopleCatalog.resolveTerminalPersonId(person) }),
                rawCardPayload: JSON.stringify({ CardNo: `CARD-${String(personIndex).padStart(6, "0")}` })
            };
        });
    }

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

            if (req.method === "POST" && url.pathname === "/identity/export-users") {
                if (!checkAuth(req, deps.token)) {
                    return unauthorized(res);
                }
                const raw = await readJson(req);
                const parsed = exportUsersSchema.safeParse(raw);
                if (!parsed.success) {
                    return fail(res, 400, "Invalid export-users payload");
                }

                const deviceIds =
                    parsed.data.target.mode === "device"
                        ? [parsed.data.target.deviceId]
                        : parsed.data.target.mode === "devices"
                            ? parsed.data.target.deviceIds
                            : ["mock-device"];

                const deviceResults = deviceIds.map((deviceId) => {
                    const allUsers = buildExportUsers(deviceId);
                    const users = allUsers.slice(parsed.data.offset, parsed.data.offset + parsed.data.limit);
                    return {
                        deviceId,
                        exportedCount: users.length,
                        failed: false,
                        hasMore: parsed.data.offset + parsed.data.limit < allUsers.length,
                        users
                    };
                });

                if (parsed.data.view === "flat") {
                    return ok(res, {
                        view: "flat",
                        users: deviceResults.flatMap((item) => item.users),
                        devices: deviceResults.map(({ ...item }) => item)
                    });
                }

                return ok(res, {
                    view: "grouped",
                    devices: deviceResults
                });
            }

            if (
                req.method === "POST" &&
                url.pathname === "/identity/users/bulk-create"
            ) {
                if (!checkAuth(req, deps.token)) {
                    return unauthorized(res);
                }
                const raw = await readJson(req);
                const parsed = bulkWriteUsersSchema.safeParse(raw);
                if (!parsed.success) {
                    return fail(res, 400, "Invalid bulk-write-users payload");
                }

                const deviceIds =
                    parsed.data.target.mode === "device"
                        ? [parsed.data.target.deviceId]
                        : parsed.data.target.mode === "devices"
                            ? parsed.data.target.deviceIds
                            : ["mock-device"];

                return ok(res, {
                    results: parsed.data.persons.flatMap((person) =>
                        deviceIds.map((deviceId) => ({
                            userId: person.userId,
                            deviceId,
                            operation: "create",
                            status: "success",
                            steps: {
                                accessUser: "success",
                                accessCard: "skipped",
                                accessFace: "skipped"
                            }
                        }))
                    )
                });
            }

            if (
                req.method === "POST" &&
                (url.pathname === "/identity/users/create" || url.pathname === "/identity/users/update")
            ) {
                if (!checkAuth(req, deps.token)) {
                    return unauthorized(res);
                }
                const raw = await readJson(req);
                const parsed = writeUsersSchema.safeParse(raw);
                if (!parsed.success) {
                    return fail(res, 400, "Invalid write-users payload");
                }

                const deviceIds =
                    parsed.data.target.mode === "device"
                        ? [parsed.data.target.deviceId]
                        : parsed.data.target.mode === "devices"
                            ? parsed.data.target.deviceIds
                            : ["mock-device"];

                return ok(res, {
                    results: deviceIds.map((deviceId) => ({
                        deviceId,
                        operation: url.pathname.endsWith("/create") ? "create" : "update",
                        status: "success",
                        steps: {
                            accessUser: "success",
                            accessCard: "skipped",
                            accessFace: "skipped"
                        }
                    }))
                });
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
