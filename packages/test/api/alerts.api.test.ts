import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { alertRules } from "@school-gate/db/schema";
import { createAlertRulesRepo } from "@school-gate/infra/drizzle/repos/alertRules.repo";
import { createRuntimeSettingsService } from "@school-gate/infra";
import { createLogger } from "@school-gate/infra/logging/logger";
import {
    createAllowAllAdminAuth,
    createStubAdminAuthHandlers,
    createStubAdminsHandlers,
    createStubAuditLogsHandlers,
    createStubSubscriptionsHandlers,
    createStubAlertsHandlers,
} from "../helpers/adminAuth.js";
import { createTestDb } from "../helpers/testDb.js";
import { createApiApp } from "../../../apps/api/src/app.js";
import { createCreateAlertRuleUC } from "@school-gate/core/usecases/createAlertRule";
import { createListAlertRulesUC } from "@school-gate/core/usecases/listAlertRules";
import { createUpdateAlertRuleUC } from "@school-gate/core/usecases/updateAlertRule";

describe("API alerts routes", () => {
    let cleanup: () => void;
    let db: ReturnType<typeof createTestDb>["db"];
    let app: ReturnType<typeof createApiApp>;

    const now = new Date("2026-01-10T00:00:00.000Z");

    beforeAll(() => {
        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;

        const runtimeSettings = createRuntimeSettingsService(db);
        const logger = createLogger({ name: "api-test", level: "silent" });

        const rulesRepo = createAlertRulesRepo(db);
        const listRules = createListAlertRulesUC({ rulesRepo });
        const createRule = createCreateAlertRuleUC({
            rulesRepo,
            idGen: { nextId: () => "rule-1" },
            clock: { now: () => now },
        });
        const updateRule = createUpdateAlertRuleUC({
            rulesRepo,
            clock: { now: () => now },
        });

        app = createApiApp({
            logger,
            adminAuth: createAllowAllAdminAuth(),
            adminAuthModule: createStubAdminAuthHandlers(),
            admins: createStubAdminsHandlers(),
            runtimeSettings,
            accessEvents: {
                verifyIngestAuth: async (_c, next) => next(),
                module: {
                    ingest: async () => ({
                        result: "duplicate",
                        status: "NEW",
                        personId: null,
                        accessEventId: null,
                    }),
                },
            },
            accessEventsAdmin: {
                listUnmatched: async () => [],
                mapTerminalIdentity: async () => ({ status: "already_linked", updatedEvents: 0 }),
            },
            persons: {
                searchByIin: async () => [],
            },
            subscriptionRequests: {
                listPending: async () => ({ requests: [], page: { limit: 50, offset: 0, total: 0 } }),
                review: async () => ({ requestId: "r1", status: "rejected", personId: null }),
            },
            alerts: {
                listRules: (input) => listRules(input),
                createRule: (input) => createRule(input),
                updateRule: (input) => updateRule(input),
                listSubscriptions: createStubAlertsHandlers().listSubscriptions,
                setSubscription: createStubAlertsHandlers().setSubscription,
                listEvents: createStubAlertsHandlers().listEvents,
            },
            subscriptions: createStubSubscriptionsHandlers(),
            auditLogs: createStubAuditLogsHandlers(),
            retention: {
                applySchedule: async () => ({
                    taskName: "school-gate-retention",
                    platform: process.platform,
                    pollMs: 300000,
                    intervalMinutes: 5,
                }),
                removeSchedule: async () => ({
                    taskName: "school-gate-retention",
                    platform: process.platform,
                    removed: true,
                }),
                runOnce: async () => ({
                    accessEventsDeleted: 0,
                    auditLogsDeleted: 0,
                    accessEventsCutoff: new Date("2026-01-01T00:00:00.000Z"),
                    auditLogsCutoff: new Date("2026-01-01T00:00:00.000Z"),
                    batch: 500,
                    accessEventsDays: 30,
                    auditLogsDays: 30,
                }),
            },
            monitoring: {
                getSnapshot: async () => ({
                    now,
                    accessEvents: {
                        counts: {
                            NEW: 0,
                            PROCESSING: 0,
                            PROCESSED: 0,
                            FAILED_RETRY: 0,
                            UNMATCHED: 0,
                            ERROR: 0,
                        },
                        oldestUnprocessedOccurredAt: null,
                    },
                    outbox: {
                        counts: { new: 0, processing: 0, processed: 0, error: 0 },
                        oldestNewCreatedAt: null,
                    },
                    workers: [],
                    topErrors: { accessEvents: [], outbox: [] },
                    components: [],
                    deviceService: null,
                }),
                listSnapshots: async () => [],
            },
        });
    });

    afterAll(() => cleanup());

    beforeEach(async () => {
        await db.delete(alertRules);
    });

    it("POST /admin/alerts/rules creates a rule", async () => {
        const res = await app.request("/api/alerts/rules", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                name: "Outbox backlog",
                type: "outbox_backlog",
                severity: "critical",
                isEnabled: true,
                config: { source: "core", maxNew: 1 },
            }),
        });

        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(json.data.ruleId).toBe("rule-1");

        const stored = await db.select().from(alertRules).all();
        expect(stored).toHaveLength(1);
        expect(stored[0]!.name).toBe("Outbox backlog");
    });

    it("GET /admin/alerts/rules lists stored rules", async () => {
        const res = await app.request("/api/alerts/rules?limit=10");
        expect(res.status).toBe(200);
        const json = (await res.json()) as any;
        expect(json.success).toBe(true);
        expect(Array.isArray(json.data.rules)).toBe(true);
    });
});



