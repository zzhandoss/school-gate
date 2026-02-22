import { getOutboxWorkerConfig } from "@school-gate/config";
import type { OutboxRuntimeOverrides } from "@school-gate/core";

export function createOutboxConfig(overrides?: OutboxRuntimeOverrides) {
    return getOutboxWorkerConfig(overrides);
}
