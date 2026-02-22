import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
    admins,
    alertEvents,
    alertRules,
    alertSubscriptions,
    outboxEvents,
    roles
} from "@school-gate/db/schema";
import type { MonitoringSnapshot } from "@school-gate/core/ports/monitoring";
import { createProcessMonitoringAlertsUC } from "@school-gate/core/usecases/processMonitoringAlerts";
import { createAlertEventsRepo } from "@school-gate/infra/drizzle/repos/alertEvents.repo";
import { createAlertRulesRepo } from "@school-gate/infra/drizzle/repos/alertRules.repo";
import { createAlertSubscriptionsRepo } from "@school-gate/infra/drizzle/repos/alertSubscriptions.repo";
import { createOutboxRepo } from "@school-gate/infra/drizzle/repos/outbox.repo";
import { createRolesRepo } from "@school-gate/infra/drizzle/repos/roles.repo";
import { createAdminsRepo } from "@school-gate/infra/drizzle/repos/admins.repo";
import { createUnitOfWork } from "@school-gate/infra/drizzle/unitOfWork";
import { DomainEvents } from "@school-gate/core/events/domain";
import { createTestDb } from "../helpers/testDb.js";

describe("ProcessMonitoringAlertsUC", () => {
    let db: ReturnType<typeof createTestDb>["db"];
    let cleanup: () => void;

    beforeAll(() => {
        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;
    });

    afterAll(() => cleanup());

    beforeEach(async () => {
        await db.delete(outboxEvents);
        await db.delete(alertEvents);
        await db.delete(alertSubscriptions);
        await db.delete(alertRules);
        await db.delete(admins);
        await db.delete(roles);
    });

    function buildSnapshot(now: Date, outboxNew: number): MonitoringSnapshot {
        return {
            now,
            accessEvents: {
                counts: {
                    NEW: 0,
                    PROCESSING: 0,
                    PROCESSED: 0,
                    FAILED_RETRY: 0,
                    UNMATCHED: 0,
                    ERROR: 0
                },
                oldestUnprocessedOccurredAt: null
            },
            outbox: {
                counts: {
                    new: outboxNew,
                    processing: 0,
                    processed: 0,
                    error: 0
                },
                oldestNewCreatedAt: outboxNew > 0 ? new Date(now.getTime() - 60_000) : null
            },
            workers: [],
            topErrors: { accessEvents: [], outbox: [] },
            components: [],
            deviceService: null
        };
    }

    it("creates alert events and enqueues notifications on trigger and resolve", async () => {
        const now = new Date("2026-01-10T00:00:00.000Z");

        const rolesRepo = createRolesRepo(db);
        await rolesRepo.upsert({
            id: "role-1",
            name: "admin",
            createdAt: now,
            updatedAt: now
        });

        const adminsRepo = createAdminsRepo(db);
        await adminsRepo.create({
            id: "admin-1",
            email: "admin@example.com",
            passwordHash: "hash",
            roleId: "role-1",
            status: "active",
            name: null,
            tgUserId: "tg-1",
            createdAt: now,
            updatedAt: now
        });

        const rulesRepo = createAlertRulesRepo(db);
        await rulesRepo.create({
            id: "rule-1",
            name: "Outbox backlog",
            type: "outbox_backlog",
            severity: "critical",
            isEnabled: true,
            config: { source: "core", maxNew: 1 },
            createdAt: now,
            updatedAt: now
        });

        const subscriptionsRepo = createAlertSubscriptionsRepo(db);
        await subscriptionsRepo.upsert({
            adminId: "admin-1",
            ruleId: "rule-1",
            isEnabled: true,
            createdAt: now,
            updatedAt: now
        });

        const idGen = (() => {
            let seq = 0;
            return { nextId: () => `id-${++seq}` };
        })();

        const processAlerts = createProcessMonitoringAlertsUC({
            rulesRepo,
            subscriptionsRepo,
            eventsRepo: createAlertEventsRepo(db),
            tx: createUnitOfWork(db, {
                alertEventsRepo: createAlertEventsRepo,
                outbox: createOutboxRepo
            }),
            idGen,
            clock: { now: () => now }
        });

        const triggerSnapshot = {
            id: "snap-1",
            createdAt: now,
            snapshot: buildSnapshot(now, 2)
        };

        const triggerResult = await processAlerts({ snapshot: triggerSnapshot });
        expect(triggerResult.triggered).toBe(1);

        const storedEvents = await db.select().from(alertEvents).all();
        expect(storedEvents).toHaveLength(1);
        expect(storedEvents[0]!.status).toBe("triggered");

        const outbox = await db.select().from(outboxEvents).all();
        expect(outbox).toHaveLength(1);
        expect(outbox[0]!.type).toBe(DomainEvents.ALERT_NOTIFICATION_REQUESTED);

        const resolvedSnapshot = {
            id: "snap-2",
            createdAt: new Date(now.getTime() + 60_000),
            snapshot: buildSnapshot(new Date(now.getTime() + 60_000), 0)
        };

        const resolveResult = await processAlerts({ snapshot: resolvedSnapshot });
        expect(resolveResult.resolved).toBe(1);

        const eventsAfter = await db.select().from(alertEvents).all();
        expect(eventsAfter).toHaveLength(2);
        expect(eventsAfter.map((row) => row.status)).toContain("resolved");
    });
});

