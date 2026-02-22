import { getRetentionWorkerConfig } from "@school-gate/config";
import type { RetentionRuntimeOverrides } from "@school-gate/core";

export function createRetentionConfig(overrides?: RetentionRuntimeOverrides) {
    return getRetentionWorkerConfig(overrides);
}

