import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { accessEvents, auditLogs } from "@school-gate/db/schema/index";
import { createCleanupRetentionUC } from "@school-gate/core/usecases/cleanupRetention";
import { createAccessEventsRetentionRepo } from "@school-gate/infra/drizzle/repos/accessEventsRetention.repo";
import { createAuditLogsRetentionRepo } from "@school-gate/infra/drizzle/repos/auditLogsRetention.repo";
import { createTestDb } from "../helpers/testDb.js";

describe("Cleanup retention usecase", () => {
    let cleanup: () => void;
    let db: ReturnType<typeof createTestDb>["db"];

    beforeAll(() => {
        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;
    });

    afterAll(() => {
        cleanup();
    });

    beforeEach(async () => {
        await db.delete(accessEvents);
        await db.delete(auditLogs);
    });

    it("deletes only terminal access events and old audit logs with batch limit", async () => {
        const now = new Date("2026-01-31T00:00:00.000Z");
        const old = new Date("2025-12-01T00:00:00.000Z");
        const fresh = new Date("2026-01-20T00:00:00.000Z");

        await db.insert(accessEvents).values([
            {
                id: "ae-old-1",
                deviceId: "dev-1",
                direction: "IN",
                occurredAt: old,
                idempotencyKey: "dev-1:ae-old-1",
                status: "PROCESSED",
            },
            {
                id: "ae-old-2",
                deviceId: "dev-1",
                direction: "IN",
                occurredAt: old,
                idempotencyKey: "dev-1:ae-old-2",
                status: "UNMATCHED",
            },
            {
                id: "ae-old-3",
                deviceId: "dev-1",
                direction: "OUT",
                occurredAt: old,
                idempotencyKey: "dev-1:ae-old-3",
                status: "ERROR",
            },
            {
                id: "ae-old-retry",
                deviceId: "dev-1",
                direction: "OUT",
                occurredAt: old,
                idempotencyKey: "dev-1:ae-old-retry",
                status: "FAILED_RETRY",
            },
            {
                id: "ae-fresh",
                deviceId: "dev-1",
                direction: "IN",
                occurredAt: fresh,
                idempotencyKey: "dev-1:ae-fresh",
                status: "PROCESSED",
            },
        ]);

        await db.insert(auditLogs).values([
            {
                id: "al-old-1",
                actorId: "admin-1",
                action: "test",
                entityType: "subscription_request",
                entityId: "r-1",
                at: old,
            },
            {
                id: "al-old-2",
                actorId: "admin-1",
                action: "test",
                entityType: "subscription_request",
                entityId: "r-2",
                at: old,
            },
            {
                id: "al-old-3",
                actorId: "admin-1",
                action: "test",
                entityType: "subscription_request",
                entityId: "r-3",
                at: old,
            },
            {
                id: "al-fresh",
                actorId: "admin-1",
                action: "test",
                entityType: "subscription_request",
                entityId: "r-4",
                at: fresh,
            },
        ]);

        const cleanupRetention = createCleanupRetentionUC({
            accessEventsRetentionRepo: createAccessEventsRetentionRepo(db),
            auditLogsRetentionRepo: createAuditLogsRetentionRepo(db),
        });

        const result = await cleanupRetention({
            now,
            batch: 2,
            accessEventsDays: 30,
            auditLogsDays: 30,
        });

        expect(result.accessEventsDeleted).toBe(2);
        expect(result.auditLogsDeleted).toBe(2);

        const remainingAccessEvents = await db.select().from(accessEvents);
        const remainingAccessEventIds = remainingAccessEvents.map((row) => row.id);
        expect(remainingAccessEventIds).toContain("ae-old-retry");
        expect(remainingAccessEventIds).toContain("ae-fresh");
        const remainingOldTerminal = ["ae-old-1", "ae-old-2", "ae-old-3"].filter((id) =>
            remainingAccessEventIds.includes(id)
        );
        expect(remainingOldTerminal.length).toBe(1);

        const remainingAuditLogs = await db.select().from(auditLogs);
        const remainingAuditLogIds = remainingAuditLogs.map((row) => row.id);
        expect(remainingAuditLogIds).toContain("al-fresh");
        expect(remainingAuditLogIds.length).toBe(2);
    });
});

