export type InlineAccessEventQueue = {
    enqueue(id: string): void;
    size(): number;
    inFlight(): number;
};

export function createInlineAccessEventQueue(deps: {
    maxInFlight: number;
    processById: (id: string) => Promise<void>;
    onError?: (error: unknown) => void;
}): InlineAccessEventQueue {
    if (deps.maxInFlight <= 0) {
        throw new Error("maxInFlight must be greater than 0");
    }

    const queue: string[] = [];
    let active = 0;
    let draining = false;

    const drain = () => {
        if (draining) return;
        draining = true;
        while (active < deps.maxInFlight && queue.length > 0) {
            const id = queue.shift()!;
            active++;
            deps.processById(id)
                .catch((e) => {
                    deps.onError?.(e);
                })
                .finally(() => {
                    active--;
                    draining = false;
                    drain();
                });
        }
        draining = false;
    };

    return {
        enqueue(id: string) {
            queue.push(id);
            drain();
        },
        size() {
            return queue.length;
        },
        inFlight() {
            return active;
        }
    };
}
