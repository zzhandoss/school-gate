import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { accessEvents, personTerminalIdentities, persons } from "@school-gate/db/schema";
import { createAccessEventsAdminQuery } from "@school-gate/infra/drizzle/queries/accessEventsAdmin.query";
import { createTestDb } from "../helpers/testDb.js";

describe("AccessEventsAdminQuery", () => {
    let db: ReturnType<typeof createTestDb>["db"];
    let cleanup: () => void;

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
        await db.delete(personTerminalIdentities);
        await db.delete(persons);
    });

    it("returns real lastError and person fallback iin", async () => {
        const occurredAt = new Date("2026-02-11T08:00:00.000Z");
        await db.insert(persons).values({
            id: "p-1",
            iin: "030512550123",
            firstName: "Aida",
            lastName: "Nur",
        });
        await db.insert(personTerminalIdentities).values({
            id: "pti-1",
            personId: "p-1",
            deviceId: "dev-1",
            terminalPersonId: "T-1",
        });
        await db.insert(accessEvents).values({
            id: "ev-1",
            deviceId: "dev-1",
            direction: "IN",
            occurredAt,
            terminalPersonId: "T-1",
            iin: null,
            idempotencyKey: "dev-1:ev-1",
            status: "ERROR",
            attempts: 3,
            lastError: "person_resolve_failed",
            createdAt: occurredAt,
        });

        const query = createAccessEventsAdminQuery(db);
        const result = await query.list({ limit: 10, offset: 0 });
        expect(result.total).toBe(1);
        expect(result.events[0]).toMatchObject({
            id: "ev-1",
            iin: "030512550123",
            lastError: "person_resolve_failed",
            person: {
                id: "p-1",
                iin: "030512550123",
                firstName: "Aida",
                lastName: "Nur",
            },
        });
    });

    it("prefers event iin when available", async () => {
        const occurredAt = new Date("2026-02-11T08:00:00.000Z");
        await db.insert(persons).values({
            id: "p-1",
            iin: "030512550123",
        });
        await db.insert(personTerminalIdentities).values({
            id: "pti-1",
            personId: "p-1",
            deviceId: "dev-1",
            terminalPersonId: "T-1",
        });
        await db.insert(accessEvents).values({
            id: "ev-2",
            deviceId: "dev-1",
            direction: "OUT",
            occurredAt,
            terminalPersonId: "T-1",
            iin: "990000000000",
            idempotencyKey: "dev-1:ev-2",
            status: "PROCESSED",
            attempts: 1,
            createdAt: occurredAt,
        });

        const query = createAccessEventsAdminQuery(db);
        const result = await query.list({ limit: 10, offset: 0, iin: "9900" });
        expect(result.total).toBe(1);
        expect(result.events[0]?.iin).toBe("990000000000");
    });
});
