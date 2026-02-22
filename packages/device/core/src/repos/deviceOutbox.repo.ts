import type { DeviceDomainEventType } from "../events/domain.js";
import type { DeviceDirection } from "./devices.repo.js";

export type DeviceOutboxEventPayload = {
    eventId: string;
    deviceId: string;
    direction: DeviceDirection;
    occurredAt: number;
    terminalPersonId: string | null;
    rawPayload: string | null;
};

export type DeviceOutboxEvent = {
    type: DeviceDomainEventType;
    payload: DeviceOutboxEventPayload;
};

export type DeviceOutboxRecord = {
    id: string;
    type: string;
    payloadJson: string;
    attempts: number;
};

export type DeviceOutboxStatus = "new" | "processing" | "processed" | "error";
export type DeviceOutboxStatusCounts = Record<DeviceOutboxStatus, number>;

export interface DeviceOutboxRepo {
    enqueue(input: { id: string; event: DeviceOutboxEvent }): void;
    claimBatch(input: { limit: number; now: Date; leaseMs: number; processingBy: string }): DeviceOutboxRecord[];
    markProcessed(input: { id: string; processedAt: Date }): void;
    markFailed(input: { id: string; error: string; maxAttempts: number }): void;
    getStatusCounts(): DeviceOutboxStatusCounts;
    getOldestCreatedAt(statuses: DeviceOutboxStatus[]): Date | null;
}
