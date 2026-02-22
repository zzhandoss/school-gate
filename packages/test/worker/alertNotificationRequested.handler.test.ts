import { describe, expect, it } from "vitest";
import { alertNotificationRequestedHandler } from "../../../apps/worker/src/outbox/handlers/alertNotificationRequested.handler.js";
import { createTestDb } from "../helpers/testDb.js";
import { outboxEvents } from "@school-gate/db/schema";
import { DomainEvents } from "@school-gate/core";

describe("alertNotificationRequestedHandler", () => {
    it("calls notification sender with payload", async () => {
        const sent: any[] = [];

        await alertNotificationRequestedHandler(
            {
                id: "e1",
                type: "alert.notification.requested",
                payloadJson: JSON.stringify({
                    alertEventId: "a1",
                    ruleId: "r1",
                    ruleName: "Outbox backlog",
                    severity: "critical",
                    status: "triggered",
                    message: "Outbox backlog detected",
                    createdAt: "2026-01-01T00:00:00.000Z",
                    tgUserId: "tg1"
                }),
                attempts: 0
            },
            {
                db: undefined,
                now: () => new Date(),
                newId: () => "x",
                notificationSender: {
                    sendAccessEvent: async () => {},
                    sendAlert: async (input) => {
                        sent.push(input);
                    }
                }
            }
        );

        expect(sent).toHaveLength(1);
        expect(sent[0].tgUserId).toBe("tg1");
    });

    it("throws when notification sender is missing", async () => {
        await expect(
            alertNotificationRequestedHandler(
                {
                    id: "e1",
                    type: "alert.notification.requested",
                    payloadJson: "{}",
                    attempts: 0
                },
                {
                    db: undefined,
                    now: () => new Date(),
                    newId: () => "x"
                }
            )
        ).rejects.toThrow("Notification sender not configured");
    });

    it("skips stale alert and enqueues audit event", async () => {
        const tdb = createTestDb();
        const db = tdb.db;
        const sent: any[] = [];

        await alertNotificationRequestedHandler(
            {
                id: "e-stale-alert",
                type: "alert.notification.requested",
                payloadJson: JSON.stringify({
                    alertEventId: "a1",
                    ruleId: "r1",
                    ruleName: "Outbox backlog",
                    severity: "critical",
                    status: "triggered",
                    message: "Outbox backlog detected",
                    createdAt: "2020-01-01T00:00:00.000Z",
                    tgUserId: "tg1"
                }),
                attempts: 0
            },
            {
                db,
                now: () => new Date("2026-01-01T00:00:00.000Z"),
                newId: () => "audit-2",
                notificationFreshness: { alertMaxAgeMs: 300_000 },
                notificationSender: {
                    sendAccessEvent: async () => {},
                    sendAlert: async (input) => {
                        sent.push(input);
                    }
                }
            }
        );

        expect(sent).toHaveLength(0);
        const rows = await db.select().from(outboxEvents);
        expect(rows).toHaveLength(1);
        expect(rows[0]?.id).toBe("audit-2");
        expect(rows[0]?.type).toBe(DomainEvents.AUDIT_REQUESTED);

        tdb.cleanup();
    });
});

