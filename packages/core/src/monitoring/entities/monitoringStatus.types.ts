import type { AccessEventStatus } from "../../events/index.js";

export type OutboxStatus = "new" | "processing" | "processed" | "error";
export type WorkerStatus = "ok" | "stale";
export type ComponentHealthStatus = "ok" | "down";
export type AdapterStatus = "ok" | "stale";
export type DeviceStatus = "ok" | "stale";

export type AccessEventsStatusCounts = Record<AccessEventStatus, number>;
export type OutboxStatusCounts = Record<OutboxStatus, number>;
