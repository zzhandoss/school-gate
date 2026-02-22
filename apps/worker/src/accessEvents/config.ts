import { getAccessEventsWorkerConfig } from "@school-gate/config";
import type { AccessEventsRuntimeOverrides } from "@school-gate/core";

export function createAccessEventsConfig(overrides?: AccessEventsRuntimeOverrides) {
    return getAccessEventsWorkerConfig(overrides);
}
