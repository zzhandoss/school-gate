import { describe, expect, it } from "vitest";
import { renderParentNotification } from "../../../apps/worker/src/outbox/notificationSender.js";
import type { AccessNotification } from "@school-gate/core/ports/notificationSender";

const basePayload: AccessNotification = {
    accessEventId: "e1",
    deviceId: "d1",
    direction: "IN",
    occurredAt: "2026-01-01T10:00:00.000Z",
    personId: "p1",
    firstName: "Иван",
    lastName: "Иванов",
    tgUserId: "100"
};

describe("notificationSender", () => {
    it("renders parent template with direction word", () => {
        const template = "{{firstName}} {{lastName}} {{directionWord}} школу. Время: {{time}}";
        const text = renderParentNotification(template, basePayload);
        expect(text).toContain("Иван Иванов вошел школу. Время:");
    });

    it("uses покинул for OUT direction", () => {
        const template = "{{directionWord}}";
        const text = renderParentNotification(template, { ...basePayload, direction: "OUT" });
        expect(text).toBe("покинул");
    });
});

