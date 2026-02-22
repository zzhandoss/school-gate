import { describe, expect, it } from "vitest";
import { formatDashboardMessage } from "../../../apps/bot/src/telegram/messages.js";

describe("telegram dashboard message", () => {
    it("renders subscriptions and requests", () => {
        const text = formatDashboardMessage({
            subscriptions: [
                {
                    id: "sub-1",
                    isActive: true,
                    person: {
                        iin: "030512550123",
                        firstName: "Ivan",
                        lastName: "Petrov"
                    }
                }
            ],
            requests: [
                {
                    id: "req-1",
                    iin: "030512550123",
                    status: "pending",
                    resolutionStatus: "ready_for_review",
                    resolutionMessage: null,
                    createdAt: "2020-01-01T00:00:00.000Z"
                }
            ]
        });

        expect(text).toContain("Ваши подписки");
        expect(text).toContain("Ivan Petrov");
        expect(text).toContain("На проверке у администратора");
    });
});
