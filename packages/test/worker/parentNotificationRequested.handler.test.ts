import { describe, expect, it } from "vitest";
import { parentNotificationRequestedHandler } from "../../../apps/worker/src/outbox/handlers/parentNotificationRequested.handler.js";
import { createTestDb } from "../helpers/testDb.js";
import { outboxEvents } from "@school-gate/db/schema";
import { DomainEvents } from "@school-gate/core";

describe("parentNotificationRequestedHandler", () => {
    it("calls notification sender with payload", async () => {
        const sent: any[] = [];

        await parentNotificationRequestedHandler(
            {
                id: "e1",
                type: "parent.notification.requested",
                payloadJson: JSON.stringify({
                    accessEventId: "ae1",
                    deviceId: "dev1",
                    direction: "IN",
                    occurredAt: "2020-01-01T00:00:00.000Z",
                    personId: "p1",
                    tgUserId: "tg1",
                }),
                attempts: 0,
            },
            {
                db: undefined,
                now: () => new Date(),
                newId: () => "x",
                notificationSender: {
                    sendAccessEvent: async (input) => {
                        sent.push(input);
                    },
                    sendAlert: async () => {},
                },
            }
        );

        expect(sent).toHaveLength(1);
        expect(sent[0].tgUserId).toBe("tg1");
    });

    it("throws when notification sender is missing", async () => {
        await expect(
            parentNotificationRequestedHandler(
                {
                    id: "e1",
                    type: "parent.notification.requested",
                    payloadJson: "{}",
                    attempts: 0,
                },
                {
                    db: undefined,
                    now: () => new Date(),
                    newId: () => "x",
                }
            )
        ).rejects.toThrow("Notification sender not configured");
    });

    it("skips stale notification and enqueues audit event", async () => {
        const tdb = createTestDb();
        const db = tdb.db;
        const sent: any[] = [];

        await parentNotificationRequestedHandler(
            {
                id: "e-stale-parent",
                type: "parent.notification.requested",
                payloadJson: JSON.stringify({
                    accessEventId: "ae1",
                    deviceId: "dev1",
                    direction: "IN",
                    occurredAt: "2020-01-01T00:00:00.000Z",
                    personId: "p1",
                    tgUserId: "tg1",
                }),
                attempts: 0,
            },
            {
                db,
                now: () => new Date("2026-01-01T00:00:00.000Z"),
                newId: () => "audit-1",
                notificationFreshness: { parentMaxAgeMs: 600_000 },
                notificationSender: {
                    sendAccessEvent: async (input) => {
                        sent.push(input);
                    },
                    sendAlert: async () => {},
                },
            }
        );

        expect(sent).toHaveLength(0);
        const rows = await db.select().from(outboxEvents);
        expect(rows).toHaveLength(1);
        expect(rows[0]?.id).toBe("audit-1");
        expect(rows[0]?.type).toBe(DomainEvents.AUDIT_REQUESTED);

        tdb.cleanup();
    });
});

