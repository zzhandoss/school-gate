import { describe, expect, it, vi } from "vitest";
import { createInlineAccessEventQueue } from "@school-gate/core/usecases/inlineAccessEventQueue";

describe("inlineAccessEventQueue", () => {
    it("limits concurrent processing", async () => {
        const resolvers: Array<() => void> = [];
        const processById = vi.fn(() => new Promise<void>((resolve) => resolvers.push(resolve)));

        const queue = createInlineAccessEventQueue({
            maxInFlight: 1,
            processById,
        });

        queue.enqueue("a");
        queue.enqueue("b");

        expect(processById).toHaveBeenCalledTimes(1);
        expect(queue.inFlight()).toBe(1);
        expect(queue.size()).toBe(1);

        resolvers.shift()!();
        await new Promise((r) => setTimeout(r, 0));

        expect(processById).toHaveBeenCalledTimes(2);
        expect(queue.inFlight()).toBe(1);
        expect(queue.size()).toBe(0);
    });
});

