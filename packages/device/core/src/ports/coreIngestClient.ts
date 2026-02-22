import type { DeviceDirection } from "../repos/devices.repo.js";

export type CoreAccessEventIngestInput = {
    eventId: string;
    deviceId: string;
    direction: DeviceDirection;
    occurredAt: number;
    terminalPersonId?: string | null;
    iin?: string | null;
    rawPayload?: string | null;
};

export type CoreAccessEventIngestResult = {
    result: "inserted" | "duplicate";
    status: "NEW" | "UNMATCHED";
    personId: string | null;
    accessEventId: string | null;
};

export type CoreAccessEventBatchResultItem = CoreAccessEventIngestResult & {
    eventId: string;
};

export type CoreAccessEventBatchResult = {
    results: CoreAccessEventBatchResultItem[];
};

export interface CoreIngestClient {
    sendEvent(input: CoreAccessEventIngestInput): Promise<CoreAccessEventIngestResult>;
    sendBatch(input: { events: CoreAccessEventIngestInput[] }): Promise<CoreAccessEventBatchResult>;
}
