import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { auditLogs, outboxEvents } from "@school-gate/db/schema/index";
import { createOutbox } from "@school-gate/infra/drizzle/repos/outbox.repo";
import { DomainEvents } from "@school-gate/core/events/domain";
import {
    processOutboxBatch
} from "../../../apps/worker/src/outbox/processOutboxBatch.js";
import { auditRequestedHandler } from "../../../apps/worker/src/outbox/handlers/auditRequested.handler.js";
import { parentNotificationRequestedHandler } from "../../../apps/worker/src/outbox/handlers/parentNotificationRequested.handler.js";



describe("Outbox worker", () => {
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
        await db.delete(outboxEvents);
    });

    it("processes audit.requested -> writes audit_logs and marks outbox processed", async () => {
        const outbox = createOutbox(db);

        outbox.enqueue({
            id: "e1",
            event: {
                type: DomainEvents.AUDIT_REQUESTED,
                payload: {
                    actorId: "admin1",
                    action: "subscription_request_approved",
                    entityType: "subscription_request",
                    entityId: "r1",
                    at: new Date("2020-01-01T00:00:00.000Z").toISOString(),
                    meta: { iin: "030512550123" }
                }
            }
        });

        const res = await processOutboxBatch(db, {
            limit: 10,
            maxAttempts: 3,
            leaseMs: 60_000,
            processingBy: "worker-1",
            now: () => new Date("2020-01-02T00:00:00.000Z"),
            newId: () => Date.now().toString(),
            handlers: { [DomainEvents.AUDIT_REQUESTED]: auditRequestedHandler }
        });

        expect(res.claimed).toBe(1);
        expect(res.processed).toBe(1);
        expect(res.failed).toBe(0);

        const logs = await db.select().from(auditLogs);
        expect(logs).toHaveLength(1);
        expect(logs[0]!.actorId).toBe("admin1");
        expect(logs[0]!.action).toBe("subscription_request_approved");

        const out = await db.select().from(outboxEvents);
        expect(out).toHaveLength(1);
        expect(out[0]!.status).toBe("processed");
        expect(out[0]!.processedAt).not.toBeNull();
    });

    it("unknown event type -> marks failed and retries until maxAttempts", async () => {
        // руками вставим неизвестный тип
        await db.insert(outboxEvents).values({
            id: "e1",
            type: "unknown",
            payloadJson: "{}",
            status: "new",
            attempts: 0
        });

        // 1 попытка -> вернётся в new (attempts станет 1)
        await processOutboxBatch(db, {
            limit: 10,
            maxAttempts: 2,
            leaseMs: 60_000,
            processingBy: "worker-1",
            now: () => new Date(),
            newId: () => Date.now().toString(),
            handlers: { [DomainEvents.AUDIT_REQUESTED]: auditRequestedHandler }
        });
        let out = await db.select().from(outboxEvents);
        expect(out[0]!.status).toBe("new");
        expect(out[0]!.attempts).toBe(1);

        // 2 попытка -> уйдёт в error
        await processOutboxBatch(db, {
            limit: 10,
            maxAttempts: 2,
            leaseMs: 60_000,
            processingBy: "worker-1",
            now: () => new Date(),
            newId: () => Date.now().toString(),
            handlers: { [DomainEvents.AUDIT_REQUESTED]: auditRequestedHandler }
        });
        out = await db.select().from(outboxEvents);
        expect(out[0]!.status).toBe("error");
        expect(out[0]!.attempts).toBe(2);
    });

    it("reclaims stale processing events", async () => {
        await db.insert(outboxEvents).values({
            id: "e-stale",
            type: DomainEvents.AUDIT_REQUESTED,
            payloadJson: JSON.stringify({
                actorId: "admin1",
                action: "subscription_request_approved",
                entityType: "subscription_request",
                entityId: "r1",
                at: new Date("2020-01-01T00:00:00.000Z").toISOString()
            }),
            status: "processing",
            attempts: 1,
            processingAt: new Date("2020-01-01T00:00:00.000Z"),
            processingBy: "worker-old"
        });

        await processOutboxBatch(db, {
            limit: 10,
            maxAttempts: 3,
            leaseMs: 1_000,
            processingBy: "worker-new",
            now: () => new Date("2020-01-01T00:10:00.000Z"),
            newId: () => Date.now().toString(),
            handlers: { [DomainEvents.AUDIT_REQUESTED]: auditRequestedHandler }
        });
        const out = await db.select().from(outboxEvents);
        expect(out[0]!.status).toBe("processed");
        expect(out[0]!.processingBy).toBe("worker-new");
    });

    it("skips stale parent notification, marks processed, and writes audit log on next batch", async () => {
        await db.insert(outboxEvents).values({
            id: "e-parent-stale",
            type: DomainEvents.PARENT_NOTIFICATION_REQUESTED,
            payloadJson: JSON.stringify({
                accessEventId: "ae1",
                deviceId: "dev1",
                direction: "IN",
                occurredAt: "2020-01-01T00:00:00.000Z",
                personId: "p1",
                tgUserId: "tg1"
            }),
            status: "new",
            attempts: 0
        });

        const first = await processOutboxBatch(db, {
            limit: 10,
            maxAttempts: 3,
            leaseMs: 60_000,
            processingBy: "worker-1",
            now: () => new Date("2026-01-02T00:00:00.000Z"),
            newId: () => "audit-from-stale",
            handlers: {
                [DomainEvents.AUDIT_REQUESTED]: auditRequestedHandler,
                [DomainEvents.PARENT_NOTIFICATION_REQUESTED]: parentNotificationRequestedHandler
            },
            notificationSender: {
                sendAccessEvent: async () => {
                    throw new Error("stale notification should not be sent");
                },
                sendAlert: async () => {}
            },
            notificationFreshness: {
                parentMaxAgeMs: 600_000
            }
        });

        expect(first.claimed).toBe(1);
        expect(first.processed).toBe(1);
        expect(first.failed).toBe(0);

        const afterFirst = await db.select().from(outboxEvents);
        const staleEvent = afterFirst.find((row) => row.id === "e-parent-stale");
        const auditEvent = afterFirst.find((row) => row.id === "audit-from-stale");
        expect(staleEvent?.status).toBe("processed");
        expect(auditEvent?.status).toBe("new");
        expect(auditEvent?.type).toBe(DomainEvents.AUDIT_REQUESTED);

        const second = await processOutboxBatch(db, {
            limit: 10,
            maxAttempts: 3,
            leaseMs: 60_000,
            processingBy: "worker-1",
            now: () => new Date("2026-01-02T00:00:01.000Z"),
            newId: () => "audit-id-2",
            handlers: { [DomainEvents.AUDIT_REQUESTED]: auditRequestedHandler }
        });

        expect(second.claimed).toBe(1);
        expect(second.processed).toBe(1);
        expect(second.failed).toBe(0);

        const logs = await db.select().from(auditLogs);
        expect(logs).toHaveLength(1);
        expect(logs[0]?.action).toBe("notification_skipped_stale");
    });
});

