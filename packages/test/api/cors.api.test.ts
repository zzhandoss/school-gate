import { beforeAll, describe, expect, it } from "vitest";
import { createLogger } from "@school-gate/infra/logging/logger";
import {
    createAllowAllAdminAuth,
    createStubAdminAuthHandlers,
    createStubAlertsHandlers,
    createStubAdminsHandlers,
    createStubAuditLogsHandlers,
    createStubSubscriptionsHandlers
} from "../helpers/adminAuth.js";
import { createApiApp } from "../../../apps/api/src/app.js";

describe("API CORS", () => {
    let app: ReturnType<typeof createApiApp>;

    beforeAll(() => {
        app = createApiApp({
            logger: createLogger({ name: "api-cors-test", level: "silent" }),
            corsAllowedOrigins: ["http://localhost:5000", "http://localhost:4100"],
            adminAuth: createAllowAllAdminAuth(),
            adminAuthModule: createStubAdminAuthHandlers(),
            admins: createStubAdminsHandlers(),
            runtimeSettings: {
                list: () => ({}) as any,
                set: () => ({ updated: 0 })
            },
            accessEvents: {
                verifyIngestAuth: async (_c, next) => next(),
                module: { ingest: async () => ({ result: "duplicate", status: "NEW", personId: null, accessEventId: null }) }
            },
            accessEventsAdmin: {
                listUnmatched: async () => [],
                mapTerminalIdentity: async () => ({ status: "already_linked", updatedEvents: 0 })
            },
            persons: { searchByIin: async () => [] },
            subscriptionRequests: {
                listPending: async () => ({ requests: [], page: { limit: 50, offset: 0, total: 0 } }),
                review: async () => ({ requestId: "r-1", status: "rejected", personId: null })
            },
            subscriptions: createStubSubscriptionsHandlers(),
            retention: {
                applySchedule: async () => ({ taskName: "retention", platform: process.platform, pollMs: 300000, intervalMinutes: 5 }),
                removeSchedule: async () => ({ taskName: "retention", platform: process.platform, removed: true }),
                runOnce: async () => ({
                    accessEventsDeleted: 0,
                    auditLogsDeleted: 0,
                    accessEventsCutoff: new Date("2026-01-01T00:00:00.000Z"),
                    auditLogsCutoff: new Date("2026-01-01T00:00:00.000Z"),
                    batch: 100,
                    accessEventsDays: 30,
                    auditLogsDays: 30
                })
            },
            monitoring: {
                getSnapshot: async () => ({
                    now: new Date("2026-01-01T00:00:00.000Z"),
                    accessEvents: {
                        counts: { NEW: 0, PROCESSING: 0, PROCESSED: 0, FAILED_RETRY: 0, UNMATCHED: 0, ERROR: 0 },
                        oldestUnprocessedOccurredAt: null
                    },
                    outbox: { counts: { new: 0, processing: 0, processed: 0, error: 0 }, oldestNewCreatedAt: null },
                    workers: [],
                    topErrors: { accessEvents: [], outbox: [] },
                    components: [],
                    deviceService: null
                }),
                listSnapshots: async () => []
            },
            alerts: createStubAlertsHandlers(),
            auditLogs: createStubAuditLogsHandlers()
        });
    });

    it("allows preflight for whitelisted origin", async () => {
        const res = await app.request("/api/auth/login", {
            method: "OPTIONS",
            headers: {
                origin: "http://localhost:5000",
                "access-control-request-method": "POST",
                "access-control-request-headers": "authorization,content-type"
            }
        });

        expect(res.status).toBe(204);
        expect(res.headers.get("access-control-allow-origin")).toBe("http://localhost:5000");
        expect(res.headers.get("access-control-allow-credentials")).toBe("true");
    });

    it("does not echo disallowed origin", async () => {
        const res = await app.request("/api/auth/login", {
            method: "OPTIONS",
            headers: {
                origin: "http://localhost:7777",
                "access-control-request-method": "POST"
            }
        });

        expect(res.status).toBe(204);
        expect(res.headers.get("access-control-allow-origin")).toBeNull();
    });
});

