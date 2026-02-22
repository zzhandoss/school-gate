import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { auditLogs } from "@school-gate/db/schema/index";
import { createAuditLogsRepo } from "@school-gate/infra/drizzle/repos/auditLogs.repo";

describe("AuditLogsRepo", () => {
    let db: ReturnType<typeof createTestDb>["db"];
    let cleanup: () => void;

    beforeAll(() => {
        const tdb = createTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;
    });

    afterAll(() => cleanup());

    beforeEach(async () => {
        await db.delete(auditLogs);
    });

    it("writes an audit log entry", async () => {
        const repo = createAuditLogsRepo(db);

        const at = new Date("2020-01-01T00:00:00.000Z");
        await repo.write({
            id: "a1",
            eventId: "e1",
            actorId: "admin1",
            action: "subscription_request_approved",
            entityType: "subscription_request",
            entityId: "r1",
            at,
            meta: { iin: "030512550123", personId: "p1" }
        });

        const rows = await db.select().from(auditLogs);
        expect(rows).toHaveLength(1);

        const row = rows[0]!;
        expect(row.id).toBe("a1");
        expect(row.eventId).toBe("e1");
        expect(row.actorId).toBe("admin1");
        expect(row.action).toBe("subscription_request_approved");
        expect(row.entityType).toBe("subscription_request");
        expect(row.entityId).toBe("r1");
        expect(row.metaJson).toContain("personId");
    });

    it("meta is nullable", async () => {
        const repo = createAuditLogsRepo(db);

        await repo.write({
            id: "a1",
            actorId: "admin1",
            action: "subscription_request_rejected",
            entityType: "subscription_request",
            entityId: "r2",
            at: new Date()
        });

        const rows = await db.select().from(auditLogs);
        expect(rows[0]!.metaJson).toBeNull();
    });

    it("deduplicates by eventId", async () => {
        const repo = createAuditLogsRepo(db);

        await repo.write({
            id: "a1",
            eventId: "e1",
            actorId: "admin1",
            action: "subscription_request_approved",
            entityType: "subscription_request",
            entityId: "r1",
            at: new Date()
        });

        await repo.write({
            id: "a2",
            eventId: "e1",
            actorId: "admin2",
            action: "subscription_request_approved",
            entityType: "subscription_request",
            entityId: "r1",
            at: new Date()
        });

        const rows = await db.select().from(auditLogs);
        expect(rows).toHaveLength(1);
        expect(rows[0]!.id).toBe("a1");
        expect(rows[0]!.eventId).toBe("e1");
    });

    it("lists with date filters and total", async () => {
        const repo = createAuditLogsRepo(db);

        await repo.write({
            id: "a1",
            actorId: "admin1",
            action: "alpha",
            entityType: "subscription_request",
            entityId: "r1",
            at: new Date("2026-01-01T00:00:00.000Z")
        });
        await repo.write({
            id: "a2",
            actorId: "admin1",
            action: "alpha",
            entityType: "subscription_request",
            entityId: "r2",
            at: new Date("2026-01-02T00:00:00.000Z")
        });
        await repo.write({
            id: "a3",
            actorId: "admin1",
            action: "beta",
            entityType: "subscription_request",
            entityId: "r3",
            at: new Date("2026-01-03T00:00:00.000Z")
        });

        const result = await repo.list({
            limit: 1,
            offset: 0,
            actorId: "admin1",
            action: "alpha",
            from: new Date("2026-01-01T00:00:00.000Z"),
            to: new Date("2026-01-02T23:59:59.999Z")
        });

        expect(result.page.total).toBe(2);
        expect(result.logs).toHaveLength(1);
        expect(result.logs[0]!.id).toBe("a2");
    });
});
